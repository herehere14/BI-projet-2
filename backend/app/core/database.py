"""
Async-SQLAlchemy setup **plus** model re-exports (no duplicate classes).

Exposes
▪ engine / AsyncSessionLocal / Base
▪ get_db()        – FastAPI dependency (AsyncSession generator)
▪ init_db()       – dev helper to auto-create tables
▪ shutdown()      – graceful engine disposal
▪ Company / Kpi / News – re-exported ORM models from app.models
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import declarative_base

from app.core.settings import settings

# ──────────────────────────────
# Engine & Session factory
# ──────────────────────────────
engine: AsyncEngine = create_async_engine(
    settings.DATABASE_URL,
    echo=getattr(settings, "DB_ECHO", False),
    pool_pre_ping=True,
)

AsyncSessionLocal: async_sessionmaker[AsyncSession] = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
)

Base = declarative_base()

# ──────────────────────────────
# FastAPI dependency
# ──────────────────────────────
@asynccontextmanager
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

# ──────────────────────────────
# Dev helpers (not for prod migrations)
# ──────────────────────────────
async def init_db() -> None:
    """Create tables that don’t yet exist (dev only)."""
    async with engine.begin() as conn:
        import app.models  # noqa: F401 registers models on Base
        await conn.run_sync(Base.metadata.create_all)

async def shutdown() -> None:
    """Dispose the async engine on application shutdown."""
    await engine.dispose()

# ──────────────────────────────
# Re-export canonical models so
# other modules can do:
#   from app.core.database import Company
# ──────────────────────────────
from app.models import Company, Kpi, News  # noqa: E402  keep at bottom
