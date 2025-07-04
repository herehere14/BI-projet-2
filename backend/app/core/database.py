"""
Async-SQLAlchemy setup.

Exposes:
    • engine              – AsyncEngine bound to asyncpg
    • AsyncSessionLocal   – async_sessionmaker factory
    • Base                – declarative base for ORM models
    • get_db()            – FastAPI dependency (yields an AsyncSession)
    • init_db()           – dev helper to auto-create tables
    • shutdown()          – graceful engine disposal on shutdown
    • Model classes       – Kpi, News, Company for direct import
"""

from __future__ import annotations

from typing import AsyncGenerator
from datetime import datetime
from enum import Enum

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, JSON, Enum as SQLEnum, ARRAY

from .settings import settings

# ------------------------------------------------------------------------- #
# Engine & Session factory
# ------------------------------------------------------------------------- #

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

# ------------------------------------------------------------------------- #
# ORM Models (added for existing route imports)
# ------------------------------------------------------------------------- #

class Company(Base):
    """Business entity being tracked"""
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    industry = Column(String(100), nullable=True)
    sector = Column(String(100), nullable=True)
    business_model = Column(Text, nullable=True)
    key_products = Column(ARRAY(String), nullable=True)
    target_markets = Column(ARRAY(String), nullable=True)
    description = Column(Text, nullable=True)
    ticker_symbol = Column(String(20), nullable=True, unique=True)

class KpiType(str, Enum):
    FINANCIAL = "financial"
    OPERATIONAL = "operational"
    CUSTOMER = "customer"
    EMPLOYEE = "employee"

class Kpi(Base):
    """Key Performance Indicators tracking"""
    __tablename__ = "kpis"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    metric = Column(String(100), nullable=False)
    value = Column(Float, nullable=False)
    target = Column(Float, nullable=True)
    as_of = Column(DateTime(timezone=True), nullable=False, index=True)
    type = Column(SQLEnum(KpiType), nullable=False)
    unit = Column(String(20), nullable=True)
    description = Column(Text, nullable=True)
    
    company = relationship("Company", backref="kpis")

class News(Base):
    """Financial news articles with metadata"""
    __tablename__ = "news"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    url = Column(String(512), unique=True, nullable=False)
    source = Column(String(100), nullable=False)
    published_at = Column(DateTime(timezone=True), nullable=False, index=True)
    description = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    sentiment = Column(Float, nullable=True)
    relevance_score = Column(Float, nullable=True)
    raw_data = Column(JSON, nullable=True)

# ------------------------------------------------------------------------- #
# FastAPI helpers
# ------------------------------------------------------------------------- #

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    **Dependency** – yields a fresh `AsyncSession` per request.

    Usage inside a router:
    ```python
    @router.get("/items")
    async def list_items(db: AsyncSession = Depends(get_db)):
        ...
    ```
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db() -> None:
    """
    Dev-utility: create all tables that don't yet exist.

    In production rely on Alembic migrations instead.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def shutdown() -> None:
    """Dispose the engine on application shutdown."""
    await engine.dispose()