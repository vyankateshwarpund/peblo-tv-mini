from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from backend.app.schemas.episode import EpisodeOut


class SeasonBase(BaseModel):
    season_number: int = Field(..., ge=0)
    title: str = ""

class SeasonCreate(SeasonBase):
    pass

class SeasonUpdate(BaseModel):
    season_number: int | None = Field(None, ge=0)
    title: str | None = None

class SeasonOut(SeasonBase):
    id: int
    show_id: int
    created_at: datetime
    updated_at: datetime
    episode_count: int | None = 0

    model_config = ConfigDict(from_attributes=True)

class SeasonDetailOut(SeasonOut):
    episodes: list[EpisodeOut] = []
