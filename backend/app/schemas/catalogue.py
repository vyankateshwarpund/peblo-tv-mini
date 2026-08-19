from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ValidationErrorItem(BaseModel):
    entity_type: str
    entity_id: int | None = None
    entity_title: str | None = None
    field: str
    message: str

class ValidationReport(BaseModel):
    can_publish: bool
    total_issues: int
    errors: list[ValidationErrorItem]

class PublishRunOut(BaseModel):
    id: int
    triggered_by: str
    started_at: datetime
    completed_at: datetime | None = None
    status: str
    published_show_count: int
    published_episode_count: int
    error_message: str | None = None

    model_config = ConfigDict(from_attributes=True)

class CatalogueEpisode(BaseModel):
    content_group: str
    episode_number: int
    title: str
    duration_seconds: int | None = None
    languages: list[str]
    artwork: dict[str, str | None]

class CatalogueSeason(BaseModel):
    season_number: int
    episodes: list[CatalogueEpisode]

class CatalogueShow(BaseModel):
    show_id: int
    title: str
    slug: str
    synopsis: str
    categories: list[str]
    artwork: dict[str, str | None]
    seasons: list[CatalogueSeason]
    trailers: list[CatalogueEpisode] = []

class CatalogueRoot(BaseModel):
    generated_at: str
    sections: dict[str, list[CatalogueShow]]
