"""backend/app/core/database.py
=================================
Async SQLAlchemy helpers for FastAPI.

Exposes
-------
- ``engine``: the global :class:`~sqlalchemy.ext.asyncio.AsyncEngine`
- ``AsyncSessionLocal``: session factory that yields :class:`~sqlalchemy.ext.asyncio.AsyncSession`
- ``Base``: declarative base for your ORM models
- ``get_db``: FastAPI dependency – yields one session per request
- ``init_db``: create tables at startup (must be run *after* all models are imported)
- ``shutdown``: dispose the engine cleanly on application shutdown
"""
from __future__ import annotations

import os
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import declarative_base
from sqlalchemy.engine import Engine



# ---------------------------------------------------------------------------
# Engine configuration
# ---------------------------------------------------------------------------

DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./app.db")

engine: AsyncEngine = create_async_engine(
    DATABASE_URL,
    echo=os.getenv("SQLALCHEMY_ECHO", "false").lower() == "true",
    future=True,  # use SQLAlchemy 2.0 style
)

# ---------------------------------------------------------------------------
# Session factory & Declarative base
# ---------------------------------------------------------------------------

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession,
)

Base = declarative_base()

# ---------------------------------------------------------------------------
# FastAPI dependency
# ---------------------------------------------------------------------------
def get_engine() -> Engine:
    """Return a synchronous SQLAlchemy engine bound to the same database."""
    return engine.sync_engine

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield a single ``AsyncSession`` for the lifetime of the request."""

    async with AsyncSessionLocal() as session:
        yield session  # FastAPI handles teardown


# ---------------------------------------------------------------------------
# Startup / Shutdown helpers
# ---------------------------------------------------------------------------


async def init_db() -> None:
    """Create all tables.

    Import *all* model modules before calling this so their ``Base`` subclasses
    are registered on the metadata. In ``app.main`` you can do:

    >>> from app.core.database import init_db
    >>> from app import models  # noqa: F401  # side‑effect import
    >>> await init_db()
    """

    # Import after engine definition to avoid circulars & ensure registration
    from app.models import Company, Kpi, News  # noqa: F401 – needed for side‑effects

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        # Ensure critical columns exist (handles older databases without migrations)
        from sqlalchemy import inspect, text

        def _check_columns(sync_conn):
            inspector = inspect(sync_conn)
            kpi_columns = [c["name"] for c in inspector.get_columns("kpi")]
            if "metric" not in kpi_columns:
                sync_conn.execute(
                    text("ALTER TABLE kpi ADD COLUMN metric VARCHAR(100)")
                )

            if "as_of" not in kpi_columns:
                sync_conn.execute(
                    text(
                        "ALTER TABLE kpi ADD COLUMN as_of TIMESTAMP WITH TIME ZONE"
                    )
                )
                
            if "description" not in kpi_columns:
                sync_conn.execute(text("ALTER TABLE kpi ADD COLUMN description TEXT"))

        await conn.run_sync(_check_columns)

async def shutdown() -> None:
    """Dispose the engine and close all pools."""

    await engine.dispose()
