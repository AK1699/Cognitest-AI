import asyncio
import os
import sys

# Add the project root and backend directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.models.user import User

DATABASE_URL = os.getenv(
    "DATABASE_URL_SYNC",
    "postgresql://postgres:postgres@localhost:5432/cognitest"
)

def make_user_admin(email: str):
    """Makes a user an admin (superuser)."""
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    with SessionLocal() as session:
        try:
            # Find the user by email
            result = session.execute(select(User).where(User.email == email))
            user = result.scalar_one_or_none()

            if not user:
                print(f"User with email '{email}' not found.")
                return

            # Make the user a superuser
            user.is_superuser = True
            session.commit()
            print(f"Successfully made '{email}' an admin.")

        except Exception as e:
            session.rollback()
            print(f"An error occurred: {e}")
        finally:
            session.close()

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python scripts/make_user_admin.py <email>")
        sys.exit(1)

    user_email = sys.argv[1]
    make_user_admin(user_email)
