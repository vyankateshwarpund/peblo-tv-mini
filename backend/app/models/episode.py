from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from backend.app.db.base import Base


class Episode(Base):
    __tablename__ = "episodes"

    id = Column(Integer, primary_key=True, index=True)
    season_id = Column(Integer, ForeignKey("seasons.id", ondelete="CASCADE"), nullable=False, index=True)
    episode_number = Column(Integer, nullable=False)
    episode_title = Column(String(255), nullable=False)
    duration_seconds = Column(Integer, nullable=True)
    language = Column(String(10), index=True, nullable=False)
    content_group = Column(String(255), index=True, nullable=False)
    status = Column(String(50), index=True, nullable=False, default="draft")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC), nullable=False)

    __table_args__ = (
        UniqueConstraint("content_group", "language", name="uq_content_group_language"),
    )

    season = relationship("Season", back_populates="episodes")
    artworks = relationship("Artwork", back_populates="episode", cascade="all, delete-orphan")
