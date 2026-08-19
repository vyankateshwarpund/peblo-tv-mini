from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
from backend.app.db.base import Base

class PublishRun(Base):
    __tablename__ = "publish_runs"

    id = Column(Integer, primary_key=True, index=True)
    triggered_by = Column(String(255), nullable=False)
    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), nullable=False, default="running")
    published_show_count = Column(Integer, default=0)
    published_episode_count = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
