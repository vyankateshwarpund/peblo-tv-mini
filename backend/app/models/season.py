from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from backend.app.db.base import Base

class Season(Base):
    __tablename__ = "seasons"

    id = Column(Integer, primary_key=True, index=True)
    show_id = Column(Integer, ForeignKey("shows.id", ondelete="CASCADE"), nullable=False, index=True)
    season_number = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False, default="")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("show_id", "season_number", name="uq_show_season_number"),
    )

    show = relationship("Show", back_populates="seasons")
    episodes = relationship("Episode", back_populates="season", cascade="all, delete-orphan", order_by="Episode.episode_number")
