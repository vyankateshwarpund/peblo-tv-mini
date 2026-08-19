from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from backend.app.schemas.season import SeasonDetailOut

class ShowBase(BaseModel):
    title: str = Field(..., min_length=1)
    slug: str = Field(..., min_length=1)
    synopsis: str = ""
    section: Optional[str] = None
    categories: List[str] = []
    status: str = Field("draft", pattern="^(draft|published)$")

class ShowCreate(ShowBase):
    pass

class ShowUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1)
    slug: Optional[str] = Field(None, min_length=1)
    synopsis: Optional[str] = None
    section: Optional[str] = None
    categories: Optional[List[str]] = None
    status: Optional[str] = Field(None, pattern="^(draft|published)$")

class ShowOut(ShowBase):
    id: int
    created_at: datetime
    updated_at: datetime
    season_count: Optional[int] = 0
    episode_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

class ShowDetailOut(ShowOut):
    seasons: List[SeasonDetailOut] = []
