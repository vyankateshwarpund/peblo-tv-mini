
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from backend.app.core.dependencies import require_editor
from backend.app.db.session import get_db
from backend.app.models.season import Season
from backend.app.models.show import Show
from backend.app.schemas.season import (
    SeasonCreate,
    SeasonOut,
    SeasonUpdate,
)

router = APIRouter(prefix="/admin", tags=["Seasons Admin"])

@router.get("/shows/{show_id}/seasons", response_model=list[SeasonOut])
def list_seasons_for_show(
    show_id: int,
    db: Annotated[Session, Depends(get_db)],
    _user = Depends(require_editor)
):
    show = db.query(Show).filter(Show.id == show_id).first()
    if not show:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Show with id {show_id} not found", "errors": []}
        )
    seasons = db.query(Season).options(joinedload(Season.episodes)).filter(Season.show_id == show_id).order_by(Season.season_number).all()
    results = []
    for sn in seasons:
        results.append(SeasonOut(
            id=sn.id,
            show_id=sn.show_id,
            season_number=sn.season_number,
            title=sn.title,
            created_at=sn.created_at,
            updated_at=sn.updated_at,
            episode_count=len(sn.episodes)
        ))
    return results

@router.post("/shows/{show_id}/seasons", response_model=SeasonOut, status_code=status.HTTP_201_CREATED)
def create_season(
    show_id: int,
    payload: SeasonCreate,
    db: Annotated[Session, Depends(get_db)],
    _user = Depends(require_editor)
):
    show = db.query(Show).filter(Show.id == show_id).first()
    if not show:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Show with id {show_id} not found", "errors": []}
        )

    # Check duplicate season_number for show
    existing = db.query(Season).filter(Season.show_id == show_id, Season.season_number == payload.season_number).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "DUPLICATE_SEASON", "message": f"Season {payload.season_number} already exists for this show", "errors": []}
        )

    title = payload.title or (f"Season {payload.season_number}" if payload.season_number > 0 else "Trailers")
    season = Season(
        show_id=show_id,
        season_number=payload.season_number,
        title=title
    )
    db.add(season)
    db.commit()
    db.refresh(season)
    return SeasonOut(
        id=season.id,
        show_id=season.show_id,
        season_number=season.season_number,
        title=season.title,
        created_at=season.created_at,
        updated_at=season.updated_at,
        episode_count=0
    )

@router.patch("/seasons/{id}", response_model=SeasonOut)
def update_season(
    id: int,
    payload: SeasonUpdate,
    db: Annotated[Session, Depends(get_db)],
    _user = Depends(require_editor)
):
    season = db.query(Season).filter(Season.id == id).first()
    if not season:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Season with id {id} not found", "errors": []}
        )

    if payload.season_number is not None and payload.season_number != season.season_number:
        existing = db.query(Season).filter(Season.show_id == season.show_id, Season.season_number == payload.season_number, Season.id != id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "DUPLICATE_SEASON", "message": f"Season {payload.season_number} already exists for this show", "errors": []}
            )
        season.season_number = payload.season_number

    if payload.title is not None:
        season.title = payload.title

    db.commit()
    db.refresh(season)
    return SeasonOut(
        id=season.id,
        show_id=season.show_id,
        season_number=season.season_number,
        title=season.title,
        created_at=season.created_at,
        updated_at=season.updated_at,
        episode_count=len(season.episodes)
    )

@router.delete("/seasons/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_season(
    id: int,
    db: Annotated[Session, Depends(get_db)],
    _user = Depends(require_editor)
):
    season = db.query(Season).filter(Season.id == id).first()
    if not season:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Season with id {id} not found", "errors": []}
        )
    db.delete(season)
    db.commit()
