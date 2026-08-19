from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.orm import relationship
from backend.app.db.base import Base

class Show(Base):
    __tablename__ = "shows"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    synopsis = Column(Text, nullable=False, default="")
    section = Column(String(100), index=True, nullable=True)
    categories = Column(JSON, nullable=False, default=list)
    status = Column(String(50), index=True, nullable=False, default="draft")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    seasons = relationship("Season", back_populates="show", cascade="all, delete-orphan", order_by="Season.season_number")
