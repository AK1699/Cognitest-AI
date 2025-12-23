"""
User Invitation API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List
from uuid import UUID
from datetime import datetime, timezone

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.invitation import UserInvitation, InvitationStatus
from app.models.organisation import Organisation
from app.models.group import Group, user_groups
from app.schemas.invitation import (
    InvitationCreate,
    InvitationResponse,
    InvitationAccept,
    InvitationList,
    InvitationResend
)
from app.schemas.user import UserResponse
from app.services.email import email_service
from app.core.security import get_password_hash

router = APIRouter()


def utcnow():
    """Get current UTC time with timezone info"""
    return datetime.now(timezone.utc)


@router.post("/", response_model=InvitationResponse, status_code=status.HTTP_201_CREATED)
async def create_invitation(
    invitation_data: InvitationCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new user invitation and send welcome email.

    The invited user will receive an email with a link to sign up.
    """
    # Check if organisation exists
    result = await db.execute(
        select(Organisation).where(Organisation.id == invitation_data.organisation_id)
    )
    organisation = result.scalar_one_or_none()

    if not organisation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organisation not found"
        )

    # Check if user already exists
    existing_user = await db.execute(
        select(User).where(User.email == invitation_data.email)
    )
    if existing_user.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email {invitation_data.email} already exists"
        )

    # Check if there's already a pending invitation
    existing_invitation = await db.execute(
        select(UserInvitation).where(
            and_(
                UserInvitation.email == invitation_data.email,
                UserInvitation.organisation_id == invitation_data.organisation_id,
                UserInvitation.status == InvitationStatus.PENDING
            )
        )
    )
    if existing_invitation.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Pending invitation already exists for {invitation_data.email}"
        )

    # Create invitation
    invitation = UserInvitation(
        email=invitation_data.email,
        full_name=invitation_data.full_name,
        organisation_id=invitation_data.organisation_id,
        invitation_token=UserInvitation.generate_token(),
        expires_at=UserInvitation.calculate_expiry(invitation_data.expiry_days),
        invited_by=current_user.id,
        group_ids=",".join([str(gid) for gid in invitation_data.group_ids]) if invitation_data.group_ids else None,
        role_id=invitation_data.role_id
    )

    db.add(invitation)
    await db.commit()
    await db.refresh(invitation)

    # Send invitation email in background (non-blocking)
    background_tasks.add_task(
        email_service.send_invitation_email,
        to_email=invitation.email,
        full_name=invitation.full_name,
        organisation_name=organisation.name,
        inviter_name=current_user.full_name or current_user.username,
        invitation_token=invitation.invitation_token,
        expires_in_days=invitation_data.expiry_days
    )

    return invitation


@router.get("/", response_model=InvitationList)
async def list_invitations(
    organisation_id: UUID,
    status_filter: InvitationStatus = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all invitations for an organisation.

    - **organisation_id**: Organisation ID (required)
    - **status_filter**: Filter by invitation status (optional)
    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    """
    query = select(UserInvitation).where(
        UserInvitation.organisation_id == organisation_id
    )

    if status_filter:
        query = query.where(UserInvitation.status == status_filter)

    # Get total count
    from sqlalchemy import func
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Get invitations with pagination
    query = query.offset(skip).limit(limit).order_by(UserInvitation.created_at.desc())
    result = await db.execute(query)
    invitations = result.scalars().all()

    return InvitationList(invitations=invitations, total=total)


@router.get("/verify-token")
async def verify_invitation_token(
    token: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Verify an invitation token and return invitation details.
    
    This is called by the accept-invitation page to display invitation info.
    No authentication required.
    """
    from app.models.organisation import OrganizationRole
    from sqlalchemy.orm import selectinload
    
    # Find invitation by token
    result = await db.execute(
        select(UserInvitation)
        .options(selectinload(UserInvitation.organisation))
        .where(UserInvitation.invitation_token == token)
    )
    invitation = result.scalar_one_or_none()

    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid invitation token"
        )

    # Check if invitation is valid
    if not invitation.is_valid():
        if invitation.status == InvitationStatus.ACCEPTED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This invitation has already been accepted"
            )
        elif invitation.status == InvitationStatus.EXPIRED or utcnow() > invitation.expires_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This invitation has expired"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This invitation is no longer valid"
            )

    # Get role name if role_id is set
    # Note: role_id refers to project roles, not organization roles
    role_name = None
    role_type = None
    if invitation.role_id:
        from app.models.role import ProjectRole
        role_result = await db.execute(
            select(ProjectRole).where(ProjectRole.id == invitation.role_id)
        )
        role = role_result.scalar_one_or_none()
        if role:
            role_name = role.name
            role_type = role.role_type

    return {
        "email": invitation.email,
        "full_name": invitation.full_name,
        "organisation_name": invitation.organisation.name if invitation.organisation else None,
        "role_name": role_name,
        "role_type": role_type,
        "expires_at": invitation.expires_at.isoformat() if invitation.expires_at else None
    }


@router.post("/accept", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def accept_invitation(
    accept_data: InvitationAccept,
    db: AsyncSession = Depends(get_db)
):
    """
    Accept an invitation and create user account.

    This endpoint is called when a user clicks the invitation link and signs up.
    """
    print(f"[accept_invitation] Processing invitation token: {accept_data.invitation_token[:20]}...")
    
    # Find invitation by token
    result = await db.execute(
        select(UserInvitation).where(
            UserInvitation.invitation_token == accept_data.invitation_token
        )
    )
    invitation = result.scalar_one_or_none()

    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid invitation token"
        )

    # Check if invitation is valid
    if not invitation.is_valid():
        if invitation.status == InvitationStatus.ACCEPTED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This invitation has already been accepted"
            )
        elif invitation.status == InvitationStatus.EXPIRED or utcnow() > invitation.expires_at:
            invitation.status = InvitationStatus.EXPIRED
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This invitation has expired"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This invitation is no longer valid"
            )

    # Check if user already exists
    print(f"[accept_invitation] Checking if user with email {invitation.email} already exists...")
    existing_user_result = await db.execute(
        select(User).where(User.email == invitation.email)
    )
    existing_user = existing_user_result.scalar_one_or_none()

    if existing_user:
        # User was already created (possibly from a previous incomplete acceptance)
        print(f"[accept_invitation] User already exists with ID {existing_user.id}")
        new_user = existing_user
    else:
        # Check if username is taken
        print(f"[accept_invitation] Checking if username {accept_data.username} is taken...")
        existing_username = await db.execute(
            select(User).where(User.username == accept_data.username)
        )
        if existing_username.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Username '{accept_data.username}' is already taken"
            )

        # Create user account
        print(f"[accept_invitation] Creating new user account...")
        try:
            new_user = User(
                email=invitation.email,
                username=accept_data.username,
                hashed_password=get_password_hash(accept_data.password),
                full_name=accept_data.full_name or invitation.full_name,
                is_active=True
            )

            db.add(new_user)
            await db.flush()
            print(f"[accept_invitation] User created with ID {new_user.id}")
        except Exception as e:
            print(f"[accept_invitation] ERROR creating user: {e}")
            import traceback
            traceback.print_exc()
            raise

    # Add user to the organization using ORM
    from app.models.organisation import UserOrganisation
    try:
        print(f"[accept_invitation] Adding user {new_user.id} to org {invitation.organisation_id}...")
        
        # Check if user is already in the organization
        existing_membership = await db.execute(
            select(UserOrganisation).where(
                UserOrganisation.user_id == new_user.id,
                UserOrganisation.organisation_id == invitation.organisation_id
            )
        )
        if existing_membership.scalar_one_or_none():
            print(f"[accept_invitation] User already in org, skipping membership creation")
        else:
            # Create new membership
            membership = UserOrganisation(
                user_id=new_user.id,
                organisation_id=invitation.organisation_id,
                role="member",
                invited_by=invitation.invited_by,
                is_active=True
            )
            db.add(membership)
            await db.flush()
            print(f"[accept_invitation] Successfully added user to org")
    except Exception as e:
        print(f"[accept_invitation] ERROR adding user to org: {e}")
        import traceback
        traceback.print_exc()
        raise

    # Add user to groups if specified
    if invitation.group_ids:
        group_id_list = [UUID(gid) for gid in invitation.group_ids.split(",")]
        for group_id in group_id_list:
            # Verify group exists
            group_result = await db.execute(
                select(Group).where(Group.id == group_id)
            )
            group = group_result.scalar_one_or_none()

            if group:
                await db.execute(
                    user_groups.insert().values(
                        user_id=new_user.id,
                        group_id=group_id,
                        added_at=utcnow()
                    )
                )

    # Assign user to projects with the specified role if provided
    if invitation.role_id:
        from app.models.project import Project
        from sqlalchemy import text
        import uuid as uuid_lib

        try:
            # Get all projects in this organization
            print(f"[accept_invitation] Looking for projects in org {invitation.organisation_id}...")
            projects_result = await db.execute(
                select(Project).where(Project.organisation_id == invitation.organisation_id)
            )
            projects = projects_result.scalars().all()
            print(f"[accept_invitation] Found {len(projects)} projects")

            if projects:
                # Assign user to all projects in the organization with the specified role
                for project in projects:
                    try:
                        print(f"[accept_invitation] Assigning user {new_user.id} to project {project.id} with role {invitation.role_id}...")
                        await db.execute(
                            text(
                                "INSERT INTO user_project_roles (id, user_id, project_id, role_id, assigned_by) "
                                "VALUES (:id, :user_id, :project_id, :role_id, :assigned_by)"
                            ),
                            {
                                "id": str(uuid_lib.uuid4()),
                                "user_id": str(new_user.id),
                                "project_id": str(project.id),
                                "role_id": str(invitation.role_id),
                                "assigned_by": str(invitation.invited_by)
                            }
                        )
                        print(f"[accept_invitation] Successfully assigned role to project {project.id}")
                    except Exception as e:
                        # User might already have role in this project, that's okay
                        if "duplicate" not in str(e).lower():
                            print(f"[accept_invitation] ERROR assigning project role: {e}")
                            import traceback
                            traceback.print_exc()
                            raise
                        else:
                            print(f"[accept_invitation] User already has role in project {project.id}, skipping")
        except Exception as e:
            print(f"[accept_invitation] ERROR in project assignment: {e}")
            import traceback
            traceback.print_exc()
            raise

    # Mark invitation as accepted
    print(f"[accept_invitation] Marking invitation as accepted...")
    invitation.status = InvitationStatus.ACCEPTED
    invitation.accepted_at = utcnow()

    print(f"[accept_invitation] Committing transaction...")
    await db.commit()
    await db.refresh(new_user)

    print(f"[accept_invitation] SUCCESS! User {new_user.id} created and added to org")
    return new_user


@router.post("/resend", status_code=status.HTTP_200_OK)
async def resend_invitation(
    resend_data: InvitationResend,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Resend invitation email.

    Sends the invitation email again to the user.
    """
    # Get invitation
    result = await db.execute(
        select(UserInvitation).where(UserInvitation.id == resend_data.invitation_id)
    )
    invitation = result.scalar_one_or_none()

    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )

    if invitation.status != InvitationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only resend pending invitations"
        )

    # Get organisation
    org_result = await db.execute(
        select(Organisation).where(Organisation.id == invitation.organisation_id)
    )
    organisation = org_result.scalar_one_or_none()

    # Send email in background (non-blocking)
    background_tasks.add_task(
        email_service.send_invitation_email,
        to_email=invitation.email,
        full_name=invitation.full_name,
        organisation_name=organisation.name if organisation else "CogniTest",
        inviter_name=current_user.full_name or current_user.username,
        invitation_token=invitation.invitation_token,
        expires_in_days=max(1, (invitation.expires_at - utcnow()).days)
    )

    return {"message": "Invitation email resent successfully"}


@router.delete("/{invitation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_invitation(
    invitation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Revoke (cancel) a pending invitation.
    """
    result = await db.execute(
        select(UserInvitation).where(UserInvitation.id == invitation_id)
    )
    invitation = result.scalar_one_or_none()

    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )

    if invitation.status != InvitationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only revoke pending invitations"
        )

    invitation.status = InvitationStatus.REVOKED
    await db.commit()

    return None
