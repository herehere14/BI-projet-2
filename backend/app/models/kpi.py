from __future__ import annotations

import enum
import uuid
import datetime as dt

from sqlalchemy import Column, String, Float, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from ..core.database import Base

class KpiType(str, enum.Enum):
    FINANCIAL = "financial"
    OPERATIONAL = "operational"
    CUSTOMER = "customer"
    EMPLOYEE = "employee"

class Kpi(Base):
    """Key Performance Indicators tracking."""

    __tablename__ = "kpi"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("company.id"), nullable=False)
    metric = Column(String(100), nullable=False)
    value = Column(Float, nullable=False)
    target = Column(Float, nullable=True)
    as_of = Column(DateTime(timezone=True), nullable=False, index=True)
    type = Column(SQLEnum(KpiType), nullable=False)
    unit = Column(String(20), nullable=True)
    description = Column(Text, nullable=True)

    company = relationship("Company", backref="kpis")