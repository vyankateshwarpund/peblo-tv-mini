from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from backend.app.core.dependencies import require_editor, get_storage
from backend.app.db.session import get_db
from backend.app.models.show import Show
from backend.app.models.season import Season
from backend.app.models.episode import Episode
from backend.app.models.artwork import Artwork
from backend.app.schemas.show import ShowCreate, ShowUpdate, ShowOut, ShowDetailOut
from backend.app.schemas.season import SeasonDetailOut
from backend.app.schemas.episode import EpisodeOut
from backend.app.schemas.artwork import ArtworkOut
from backend.app.services.validation import ValidationService
from backend.app.storage.base import StorageBackend

router = APIRouter(prefix="/admin/shows", tags=["Shows Admin"])

def show_to_detail_out(show: Show, storage: StorageBackend) -> ShowDetailOut:
    seasons_out = []
    total_episodes = 0

    for season in sorted(show.seasons, key=lambda s: s.season_number):
        episodes_out = []
        for ep in sorted(season.episodes, key=lambda e: (e.episode_number, e.id)):
            total_episodes += 1
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
            episodes_out.append(EpisodeOut(
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
            ))

        seasons_out.append(SeasonDetailOut(
            id=season.id,
            show_id=season.show_id,
            season_number=season.season_number,
            title=season.title,
            created_at=season.created_at,
            updated_at=season.updated_at,
            episode_count=len(episodes_out),
            episodes=episodes_out
        ))

    return ShowDetailOut(
        id=show.id,
        title=show.title,
        slug=show.slug,
        synopsis=show.synopsis,
        section=show.section,
        categories=show.categories or [],
        status=show.status,
        created_at=show.created_at,
        updated_at=show.updated_at,
        season_count=len(seasons_out),
        episode_count=total_episodes,
        seasons=seasons_out
    )

@router.get("", response_model=List[ShowOut])
def list_shows(
    q: Optional[str] = None,
    section: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _user = Depends(require_editor)
):
    query = db.query(Show).options(joinedload(Show.seasons).joinedload(Season.episodes))
    if q:
        search_pattern = f"%{q.strip()}%"
        query = query.filter(Show.title.ilike(search_pattern) | Show.slug.ilike(search_pattern))
    if section:
        query = query.filter(Show.section == section)
    if status_filter:
        query = query.filter(Show.status == status_filter)

    shows = query.order_by(Show.title).offset(skip).limit(limit).all()
    results = []
    for s in shows:
        ep_count = sum(len(sn.episodes) for sn in s.seasons)
        out = ShowOut(
            id=s.id,
            title=s.title,
            slug=s.slug,
            synopsis=s.synopsis,
            section=s.section,
            categories=s.categories or [],
            status=s.status,
            created_at=s.created_at,
            updated_at=s.updated_at,
            season_count=len(s.seasons),
            episode_count=ep_count
        )
        results.append(out)
    return results

@router.get("/{id}", response_model=ShowDetailOut)
def get_show(
    id: int,
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
    _user = Depends(require_editor)
):
    show = (
        db.query(Show)
        .options(
            joinedload(Show.seasons)
            .joinedload(Season.episodes)
            .joinedload(Episode.artworks)
        )
        .filter(Show.id == id)
        .first()
    )
    if not show:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Show with id {id} not found", "errors": []}
        )
    return show_to_detail_out(show, storage)

@router.post("", response_model=ShowOut, status_code=status.HTTP_201_CREATED)
def create_show(
    payload: ShowCreate,
    db: Session = Depends(get_db),
    _user = Depends(require_editor)
):
    existing = db.query(Show).filter(Show.slug == payload.slug).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "DUPLICATE_SLUG", "message": f"Show with slug '{payload.slug}' already exists", "errors": []}
        )

    ref = ValidationService.get_reference()
    if payload.section and payload.section not in ref["sections"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_SECTION", "message": f"Invalid section '{payload.section}'", "errors": []}
        )

    if payload.status == "published" and not payload.section:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "SECTION_REQUIRED", "message": "A published show must have a valid section", "errors": []}
        )

    show = Show(
        title=payload.title,
        slug=payload.slug,
        synopsis=payload.synopsis,
        section=payload.section,
        categories=payload.categories or [],
        status=payload.status
    )
    db.add(show)
    db.commit()
    db.refresh(show)
    return ShowOut(
        id=show.id,
        title=show.title,
        slug=show.slug,
        synopsis=show.synopsis,
        section=show.section,
        categories=show.categories or [],
        status=show.status,
        created_at=show.created_at,
        updated_at=show.updated_at,
        season_count=0,
        episode_count=0
    )

@router.patch("/{id}", response_model=ShowOut)
def update_show(
    id: int,
    payload: ShowUpdate,
    db: Session = Depends(get_db),
    _user = Depends(require_editor)
):
    show = db.query(Show).filter(Show.id == id).first()
    if not show:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Show with id {id} not found", "errors": []}
        )

    if payload.slug is not None and payload.slug != show.slug:
        existing = db.query(Show).filter(Show.slug == payload.slug, Show.id != id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "DUPLICATE_SLUG", "message": f"Show with slug '{payload.slug}' already exists", "errors": []}
            )
        show.slug = payload.slug

    ref = ValidationService.get_reference()
    if payload.section is not None:
        if payload.section != "" and payload.section not in ref["sections"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "INVALID_SECTION", "message": f"Invalid section '{payload.section}'", "errors": []}
            )
        show.section = payload.section if payload.section != "" else None

    if payload.title is not None:
        show.title = payload.title
    if payload.synopsis is not None:
        show.synopsis = payload.synopsis
    if payload.categories is not None:
        show.categories = payload.categories
    if payload.status is not None:
        if payload.status == "published" and not show.section:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "SECTION_REQUIRED", "message": "A published show must have a valid section", "errors": []}
            )
        show.status = payload.status

    db.commit()
    db.refresh(show)

    ep_count = sum(len(sn.episodes) for sn in show.seasons)
    return ShowOut(
        id=show.id,
        title=show.title,
        slug=show.slug,
        synopsis=show.synopsis,
        section=show.section,
        categories=show.categories or [],
        status=show.status,
        created_at=show.created_at,
        updated_at=show.updated_at,
        season_count=len(show.seasons),
        episode_count=ep_count
    )

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_show(
    id: int,
    db: Session = Depends(get_db),
    _user = Depends(require_editor)
):
    show = db.query(Show).filter(Show.id == id).first()
    if not show:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Show with id {id} not found", "errors": []}
        )
    db.delete(show)
    db.commit()
    return None
