from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from backend.app.schemas.episode import EpisodeOut

class SeasonBase(BaseModel):
    season_number: int = Field(..., ge=0)
    title: str = ""

class SeasonCreate(SeasonBase):
    pass

class SeasonUpdate(BaseModel):
    season_number: Optional[int] = Field(None, ge=0)
    title: Optional[str] = None

class SeasonOut(SeasonBase):
    id: int
    show_id: int
    created_at: datetime
    updated_at: datetime
    episode_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

class SeasonDetailOut(SeasonOut):
    episodes: List[EpisodeOut] = []
