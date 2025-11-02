"""
User Invitation API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
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

    # Send invitation email
    email_sent = email_service.send_invitation_email(
        to_email=invitation.email,
        full_name=invitation.full_name,
        organisation_name=organisation.name,
        inviter_name=current_user.full_name or current_user.username,
        invitation_token=invitation.invitation_token,
        expires_in_days=invitation_data.expiry_days
    )

    if not email_sent:
        print(f"⚠️  Warning: Failed to send invitation email to {invitation.email}")

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


@router.post("/accept", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def accept_invitation(
    accept_data: InvitationAccept,
    db: AsyncSession = Depends(get_db)
):
    """
    Accept an invitation and create user account.

    This endpoint is called when a user clicks the invitation link and signs up.
    """
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
    existing_user_result = await db.execute(
        select(User).where(User.email == invitation.email)
    )
    existing_user = existing_user_result.scalar_one_or_none()

    if existing_user:
        # User was already created (possibly from a previous incomplete acceptance)
        new_user = existing_user
    else:
        # Check if username is taken
        existing_username = await db.execute(
            select(User).where(User.username == accept_data.username)
        )
        if existing_username.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Username '{accept_data.username}' is already taken"
            )

        # Create user account
        new_user = User(
            email=invitation.email,
            username=accept_data.username,
            hashed_password=get_password_hash(accept_data.password),
            full_name=accept_data.full_name or invitation.full_name,
            is_active=True
        )

        db.add(new_user)
        await db.flush()

    # Add user to the organization (or update if already exists)
    from sqlalchemy import text
    try:
        await db.execute(
            text(
                "INSERT INTO user_organisations (user_id, organisation_id, role, added_by) "
                "VALUES (:user_id, :org_id, :role, :added_by)"
            ),
            {
                "user_id": str(new_user.id),
                "org_id": str(invitation.organisation_id),
                "role": "member",
                "added_by": str(invitation.invited_by) if invitation.invited_by else None
            }
        )
    except Exception as e:
        # User might already be in organization, that's okay
        if "duplicate" not in str(e).lower():
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

        # Get all projects in this organization
        projects_result = await db.execute(
            select(Project).where(Project.organisation_id == invitation.organisation_id)
        )
        projects = projects_result.scalars().all()

        if projects:
            # Assign user to all projects in the organization with the specified role
            for project in projects:
                try:
                    await db.execute(
                        text(
                            "INSERT INTO user_project_roles (user_id, project_id, role_id) "
                            "VALUES (:user_id, :project_id, :role_id)"
                        ),
                        {
                            "user_id": str(new_user.id),
                            "project_id": str(project.id),
                            "role_id": str(invitation.role_id)
                        }
                    )
                except Exception as e:
                    # User might already have role in this project, that's okay
                    if "duplicate" not in str(e).lower():
                        raise

    # Mark invitation as accepted
    invitation.status = InvitationStatus.ACCEPTED
    invitation.accepted_at = utcnow()

    await db.commit()
    await db.refresh(new_user)

    return new_user


@router.post("/resend", status_code=status.HTTP_200_OK)
async def resend_invitation(
    resend_data: InvitationResend,
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

    # Send email
    email_sent = email_service.send_invitation_email(
        to_email=invitation.email,
        full_name=invitation.full_name,
        organisation_name=organisation.name if organisation else "CogniTest",
        inviter_name=current_user.full_name or current_user.username,
        invitation_token=invitation.invitation_token,
        expires_in_days=max(1, (invitation.expires_at - utcnow()).days)
    )

    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send invitation email"
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
