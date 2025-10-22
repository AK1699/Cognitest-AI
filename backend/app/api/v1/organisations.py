from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID

from app.core.deps import get_db, get_current_active_user
from app.models.organisation import Organisation
from app.models.user import User
from app.schemas.organisation import OrganisationCreate, OrganisationUpdate, OrganisationResponse

router = APIRouter()

@router.post("/", response_model=OrganisationResponse, status_code=status.HTTP_201_CREATED)
async def create_organisation(
    organisation_data: OrganisationCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new organisation.
    """
    # Create new organisation
    new_organisation = Organisation(
        name=organisation_data.name,
        website=organisation_data.website,
        description=organisation_data.description,
        owner_id=current_user.id
    )

    db.add(new_organisation)
    await db.commit()
    await db.refresh(new_organisation)

    return new_organisation

@router.get("/", response_model=List[OrganisationResponse])
async def list_organisations(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all organisations owned by the current user.
    """
    result = await db.execute(
        select(Organisation).where(Organisation.owner_id == current_user.id)
    )
    organisations = result.scalars().all()
    return organisations

@router.get("/{organisation_id}", response_model=OrganisationResponse)
async def get_organisation(
    organisation_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific organisation by ID.
    """
    result = await db.execute(
        select(Organisation).where(
            Organisation.id == organisation_id,
            Organisation.owner_id == current_user.id
        )
    )
    organisation = result.scalar_one_or_none()

    if not organisation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organisation not found"
        )

    return organisation

@router.put("/{organisation_id}", response_model=OrganisationResponse)
async def update_organisation(
    organisation_id: UUID,
    organisation_data: OrganisationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update an organisation.
    """
    result = await db.execute(
        select(Organisation).where(
            Organisation.id == organisation_id,
            Organisation.owner_id == current_user.id
        )
    )
    organisation = result.scalar_one_or_none()

    if not organisation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organisation not found"
        )

    # Update fields
    if organisation_data.name is not None:
        organisation.name = organisation_data.name
    if organisation_data.website is not None:
        organisation.website = organisation_data.website
    if organisation_data.description is not None:
        organisation.description = organisation_data.description
    if organisation_data.logo is not None:
        organisation.logo = organisation_data.logo

    await db.commit()
    await db.refresh(organisation)

    return organisation

@router.delete("/{organisation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_organisation(
    organisation_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete an organisation.
    """
    result = await db.execute(
        select(Organisation).where(
            Organisation.id == organisation_id,
            Organisation.owner_id == current_user.id
        )
    )
    organisation = result.scalar_one_or_none()

    if not organisation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organisation not found"
        )

    await db.delete(organisation)
    await db.commit()

    return None
