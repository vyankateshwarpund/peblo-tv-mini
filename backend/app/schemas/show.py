from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from backend.app.schemas.season import SeasonDetailOut


class ShowBase(BaseModel):
    title: str = Field(..., min_length=1)
    slug: str = Field(..., min_length=1)
    synopsis: str = ""
    section: str | None = None
    categories: list[str] = []
    status: str = Field("draft", pattern="^(draft|published)$")

class ShowCreate(ShowBase):
    pass

class ShowUpdate(BaseModel):
    title: str | None = Field(None, min_length=1)
    slug: str | None = Field(None, min_length=1)
    synopsis: str | None = None
    section: str | None = None
    categories: list[str] | None = None
    status: str | None = Field(None, pattern="^(draft|published)$")

class ShowOut(ShowBase):
    id: int
    created_at: datetime
    updated_at: datetime
    season_count: int | None = 0
    episode_count: int | None = 0

    model_config = ConfigDict(from_attributes=True)

class ShowDetailOut(ShowOut):
    seasons: list[SeasonDetailOut] = []
