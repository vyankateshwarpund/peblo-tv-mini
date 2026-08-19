from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from backend.app.db.base import Base


class Artwork(Base):
    __tablename__ = "artworks"

    id = Column(Integer, primary_key=True, index=True)
    episode_id = Column(Integer, ForeignKey("episodes.id", ondelete="CASCADE"), nullable=False, index=True)
    artwork_type = Column(String(50), nullable=False) # "poster", "banner", "thumbnail"
    storage_key = Column(String(512), nullable=False)
    width = Column(Integer, nullable=False)
    height = Column(Integer, nullable=False)
    file_size = Column(Integer, nullable=False) # in bytes
    mime_type = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)

    __table_args__ = (
        UniqueConstraint("episode_id", "artwork_type", name="uq_episode_artwork_type"),
    )

    episode = relationship("Episode", back_populates="artworks")

    @property
    def url(self) -> str:
        key = self.storage_key.replace("\\", "/").lstrip("/")
        return f"/storage/{key}"
