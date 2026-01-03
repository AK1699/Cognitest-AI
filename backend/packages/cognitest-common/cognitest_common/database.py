from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

def create_db_engine(database_url: str):
    """Create a SQLAlchemy async engine."""
    return create_async_engine(
        database_url,
        echo=False,
        future=True,
        pool_pre_ping=True,
    )

def create_session_factory(engine):
    """Create a SQLAlchemy async session factory."""
    return async_sessionmaker(
        engine, 
        class_=AsyncSession, 
        expire_on_commit=False, 
        autocommit=False, 
        autoflush=False
    )
