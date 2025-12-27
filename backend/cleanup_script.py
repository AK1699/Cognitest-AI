import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import os
import sys

# Ensure backend is in sys.path
sys.path.append(os.getcwd())

from app.core.config import settings
from app.models.user import User
from app.models.organisation import Organisation, UserOrganisation

async def run():
    print("Starting cleanup script...")
    try:
        engine = create_async_engine(settings.DATABASE_URL)
        AsyncSessionLocal = sessionmaker(
            engine, class_=AsyncSession, expire_on_commit=False
        )
        
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).where(User.email == 'nexisblox@gmail.com'))
            user = result.scalar_one_or_none()
            if not user:
                print('User not found: nexisblox@gmail.com')
                return
            print(f'User ID: {user.id}')
            
            # Find orgs where they are owner
            result = await db.execute(select(Organisation).where(Organisation.owner_id == user.id))
            orgs = result.scalars().all()
            if not orgs:
                print("No organisations found where user is owner_id")
            
            for org in orgs:
                print(f'Owned Org: {org.name} ({org.id})')
                # Check for memberships
                result = await db.execute(select(UserOrganisation).where(UserOrganisation.organisation_id == org.id))
                members = result.scalars().all()
                print(f'  Total memberships found: {len(members)}')
                
                # The user wants to 'remove access' - I'll clear their owner_id
                print(f'  Setting owner_id for {org.name} to None')
                org.owner_id = None
                db.add(org)
                
                # Delete their memberships if any
                for m in members:
                    if m.user_id == user.id:
                        print(f'  Deleting user membership for {user.id} in {org.name}')
                        await db.delete(m)
                
                # Also delete the org if it's empty
                if len(members) <= 1: # only them or none
                    print(f'  Deleting organization {org.name} as it is empty')
                    await db.delete(org)
                
                print(f'  Cleaned up org {org.name}')
                
            await db.commit()
            print('Done')
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == '__main__':
    asyncio.run(run())
