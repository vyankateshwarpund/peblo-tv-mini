from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from backend.app.schemas.artwork import ArtworkOut


class EpisodeBase(BaseModel):
    episode_number: int = Field(..., ge=0)
    episode_title: str = Field(..., min_length=1)
    duration_seconds: int | None = Field(None, ge=1)
    language: str = Field(..., pattern="^(en|hi)$")
    content_group: str = Field(..., min_length=1)
    status: str = Field("draft", pattern="^(draft|published)$")

class EpisodeCreate(EpisodeBase):
    pass

class EpisodeUpdate(BaseModel):
    episode_number: int | None = Field(None, ge=0)
    episode_title: str | None = Field(None, min_length=1)
    duration_seconds: int | None = Field(None, ge=1)
    language: str | None = Field(None, pattern="^(en|hi)$")
    content_group: str | None = Field(None, min_length=1)
    status: str | None = Field(None, pattern="^(draft|published)$")

class EpisodeOut(EpisodeBase):
    id: int
    season_id: int
    created_at: datetime
    updated_at: datetime
    artworks: list[ArtworkOut] = []

    model_config = ConfigDict(from_attributes=True)
