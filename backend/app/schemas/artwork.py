from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class ArtworkOut(BaseModel):
    id: int
    episode_id: int
    artwork_type: str
    storage_key: str
    url: Optional[str] = None
    width: int
    height: int
    file_size: int
    mime_type: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
