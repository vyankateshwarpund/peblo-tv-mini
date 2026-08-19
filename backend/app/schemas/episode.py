from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from backend.app.schemas.artwork import ArtworkOut

class EpisodeBase(BaseModel):
    episode_number: int = Field(..., ge=0)
    episode_title: str = Field(..., min_length=1)
    duration_seconds: Optional[int] = Field(None, ge=1)
    language: str = Field(..., pattern="^(en|hi)$")
    content_group: str = Field(..., min_length=1)
    status: str = Field("draft", pattern="^(draft|published)$")

class EpisodeCreate(EpisodeBase):
    pass

class EpisodeUpdate(BaseModel):
    episode_number: Optional[int] = Field(None, ge=0)
    episode_title: Optional[str] = Field(None, min_length=1)
    duration_seconds: Optional[int] = Field(None, ge=1)
    language: Optional[str] = Field(None, pattern="^(en|hi)$")
    content_group: Optional[str] = Field(None, min_length=1)
    status: Optional[str] = Field(None, pattern="^(draft|published)$")

class EpisodeOut(EpisodeBase):
    id: int
    season_id: int
    created_at: datetime
    updated_at: datetime
    artworks: List[ArtworkOut] = []

    model_config = ConfigDict(from_attributes=True)
