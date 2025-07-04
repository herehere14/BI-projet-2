from __future__ import annotations

import uuid
import datetime as dt

from sqlalchemy import Column, String, Text, DateTime, Float, JSON
from sqlalchemy.dialects.postgresql import UUID

from ..core.database import Base

class News(Base):
    """Financial news articles with metadata."""

    __tablename__ = "news"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    url = Column(String(512), unique=True, nullable=False)
    source = Column(String(100), nullable=False)
    published_at = Column(DateTime(timezone=True), nullable=False, index=True)
    description = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    sentiment = Column(Float, nullable=True)
    relevance_score = Column(Float, nullable=True)
    raw_data = Column(JSON, nullable=True)
