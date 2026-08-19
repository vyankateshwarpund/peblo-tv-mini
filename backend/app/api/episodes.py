from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from backend.app.core.dependencies import require_editor, get_storage
from backend.app.db.session import get_db
from backend.app.models.season import Season
from backend.app.models.episode import Episode
from backend.app.models.artwork import Artwork
from backend.app.schemas.episode import EpisodeCreate, EpisodeUpdate, EpisodeOut
from backend.app.schemas.artwork import ArtworkOut
from backend.app.services.validation import ValidationService
from backend.app.storage.base import StorageBackend

router = APIRouter(prefix="/admin", tags=["Episodes Admin"])

def episode_to_out(ep: Episode, storage: StorageBackend) -> EpisodeOut:
    artworks_out = [
        ArtworkOut(
            id=art.id,
            episode_id=art.episode_id,
            artwork_type=art.artwork_type,
            storage_key=art.storage_key,
            url=storage.get_url(art.storage_key),
            width=art.width,
            height=art.height,
            file_size=art.file_size,
            mime_type=art.mime_type,
            created_at=art.created_at
        )
        for art in ep.artworks
    ]
    return EpisodeOut(
        id=ep.id,
        season_id=ep.season_id,
        episode_number=ep.episode_number,
        episode_title=ep.episode_title,
        duration_seconds=ep.duration_seconds,
        language=ep.language,
        content_group=ep.content_group,
        status=ep.status,
        created_at=ep.created_at,
        updated_at=ep.updated_at,
        artworks=artworks_out
    )

@router.get("/episodes", response_model=List[EpisodeOut])
def list_episodes(
    q: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    language: Optional[str] = None,
    show_id: Optional[int] = None,
    season_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
    _user = Depends(require_editor)
):
    query = db.query(Episode).options(joinedload(Episode.artworks), joinedload(Episode.season))
    if show_id:
        query = query.join(Season).filter(Season.show_id == show_id)
    if season_id:
        query = query.filter(Episode.season_id == season_id)
    if status_filter:
        query = query.filter(Episode.status == status_filter)
    if language:
        query = query.filter(Episode.language == language)
    if q:
        search_pat = f"%{q.strip()}%"
        query = query.filter(Episode.episode_title.ilike(search_pat) | Episode.content_group.ilike(search_pat))

    episodes = query.order_by(Episode.season_id, Episode.episode_number).offset(skip).limit(limit).all()
    return [episode_to_out(ep, storage) for ep in episodes]

@router.get("/episodes/{id}", response_model=EpisodeOut)
def get_episode(
    id: int,
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
    _user = Depends(require_editor)
):
    ep = db.query(Episode).options(joinedload(Episode.artworks)).filter(Episode.id == id).first()
    if not ep:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Episode with id {id} not found", "errors": []}
        )
    return episode_to_out(ep, storage)

@router.post("/seasons/{season_id}/episodes", response_model=EpisodeOut, status_code=status.HTTP_201_CREATED)
def create_episode(
    season_id: int,
    payload: EpisodeCreate,
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
    _user = Depends(require_editor)
):
    season = db.query(Season).filter(Season.id == season_id).first()
    if not season:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Season with id {season_id} not found", "errors": []}
        )

    # Check unique constraint (content_group, language)
    dup = db.query(Episode).filter(
        Episode.content_group == payload.content_group,
        Episode.language == payload.language
    ).first()
    if dup:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "DUPLICATE_CONTENT_GROUP_LANGUAGE", "message": f"An episode with content_group '{payload.content_group}' and language '{payload.language}' already exists", "errors": []}
        )

    if payload.status == "published":
        if payload.duration_seconds is None or payload.duration_seconds <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "DURATION_REQUIRED", "message": "Published episode must have a valid positive duration", "errors": []}
            )

    ep = Episode(
        season_id=season_id,
        episode_number=payload.episode_number,
        episode_title=payload.episode_title,
        duration_seconds=payload.duration_seconds,
        language=payload.language,
        content_group=payload.content_group,
        status=payload.status
    )
    db.add(ep)
    db.commit()
    db.refresh(ep)
    return episode_to_out(ep, storage)

@router.patch("/episodes/{id}", response_model=EpisodeOut)
def update_episode(
    id: int,
    payload: EpisodeUpdate,
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
    _user = Depends(require_editor)
):
    ep = db.query(Episode).options(joinedload(Episode.artworks)).filter(Episode.id == id).first()
    if not ep:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Episode with id {id} not found", "errors": []}
        )

    target_cg = payload.content_group if payload.content_group is not None else ep.content_group
    target_lang = payload.language if payload.language is not None else ep.language

    if (target_cg != ep.content_group) or (target_lang != ep.language):
        dup = db.query(Episode).filter(
            Episode.content_group == target_cg,
            Episode.language == target_lang,
            Episode.id != id
        ).first()
        if dup:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "DUPLICATE_CONTENT_GROUP_LANGUAGE", "message": f"An episode with content_group '{target_cg}' and language '{target_lang}' already exists", "errors": []}
            )
        ep.content_group = target_cg
        ep.language = target_lang

    if payload.episode_number is not None:
        ep.episode_number = payload.episode_number
    if payload.episode_title is not None:
        ep.episode_title = payload.episode_title
    if payload.duration_seconds is not None:
        ep.duration_seconds = payload.duration_seconds
    if payload.status is not None:
        if payload.status == "published":
            if (ep.duration_seconds is None or ep.duration_seconds <= 0) and (payload.duration_seconds is None or payload.duration_seconds <= 0):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={"code": "DURATION_REQUIRED", "message": "Published episode must have a valid positive duration", "errors": []}
                )
        ep.status = payload.status

    db.commit()
    db.refresh(ep)
    return episode_to_out(ep, storage)

@router.delete("/episodes/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_episode(
    id: int,
    db: Session = Depends(get_db),
    _user = Depends(require_editor)
):
    ep = db.query(Episode).filter(Episode.id == id).first()
    if not ep:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Episode with id {id} not found", "errors": []}
        )
    db.delete(ep)
    db.commit()
    return None
