from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict

class ValidationErrorItem(BaseModel):
    entity_type: str
    entity_id: Optional[int] = None
    entity_title: Optional[str] = None
    field: str
    message: str

class ValidationReport(BaseModel):
    can_publish: bool
    total_issues: int
    errors: List[ValidationErrorItem]

class PublishRunOut(BaseModel):
    id: int
    triggered_by: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    status: str
    published_show_count: int
    published_episode_count: int
    error_message: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class CatalogueEpisode(BaseModel):
    content_group: str
    episode_number: int
    title: str
    duration_seconds: Optional[int] = None
    languages: List[str]
    artwork: Dict[str, Optional[str]]

class CatalogueSeason(BaseModel):
    season_number: int
    episodes: List[CatalogueEpisode]

class CatalogueShow(BaseModel):
    show_id: int
    title: str
    slug: str
    synopsis: str
    categories: List[str]
    artwork: Dict[str, Optional[str]]
    seasons: List[CatalogueSeason]
    trailers: List[CatalogueEpisode] = []

class CatalogueRoot(BaseModel):
    generated_at: str
    sections: Dict[str, List[CatalogueShow]]
