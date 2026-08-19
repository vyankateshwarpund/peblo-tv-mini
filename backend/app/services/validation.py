import json
from pathlib import Path
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from backend.app.models.show import Show
from backend.app.models.season import Season
from backend.app.models.episode import Episode
from backend.app.models.artwork import Artwork
from backend.app.schemas.catalogue import ValidationErrorItem, ValidationReport

REFERENCE_DATA = {
    "sections": ["featured", "series", "minisodes", "songs"],
    "categories": [
        "adventure", "folk", "friendship", "india", "language", "learning",
        "maths", "music", "nature", "reading", "science", "singalong",
        "stories", "travel", "values"
    ],
    "languages": ["en", "hi"],
    "artwork_specs": {
        "poster": {"aspect": "2:3", "target_px": [600, 900], "max_kb": 200},
        "banner": {"aspect": "16:9", "target_px": [1280, 720], "max_kb": 200},
        "thumbnail": {"aspect": "16:9", "target_px": [640, 360], "max_kb": 200}
    }
}

class ValidationService:
    """
    Central validation service for shows, seasons, episodes, artworks, and publish readiness.
    Both the validation report endpoint and publish endpoint MUST use this service.
    """

    @classmethod
    def get_reference(cls):
        return REFERENCE_DATA

    @classmethod
    def validate_show(cls, show: Show) -> List[ValidationErrorItem]:
        errors: List[ValidationErrorItem] = []
        
        # If show is published, section is strictly required and must be valid
        if show.status == "published":
            if not show.section:
                errors.append(ValidationErrorItem(
                    entity_type="show",
                    entity_id=show.id,
                    entity_title=show.title,
                    field="section",
                    message=f"Select a valid section before publishing show '{show.title}'."
                ))
            elif show.section not in REFERENCE_DATA["sections"]:
                errors.append(ValidationErrorItem(
                    entity_type="show",
                    entity_id=show.id,
                    entity_title=show.title,
                    field="section",
                    message=f"Show '{show.title}' has invalid section '{show.section}'. Allowed: {', '.join(REFERENCE_DATA['sections'])}."
                ))
        elif show.section and show.section not in REFERENCE_DATA["sections"]:
            errors.append(ValidationErrorItem(
                entity_type="show",
                entity_id=show.id,
                entity_title=show.title,
                field="section",
                message=f"Show '{show.title}' has invalid section '{show.section}'. Allowed: {', '.join(REFERENCE_DATA['sections'])}."
            ))

        # Validate categories
        if show.categories:
            for cat in show.categories:
                if cat not in REFERENCE_DATA["categories"]:
                    errors.append(ValidationErrorItem(
                        entity_type="show",
                        entity_id=show.id,
                        entity_title=show.title,
                        field="categories",
                        message=f"Show '{show.title}' has invalid category '{cat}'. Allowed: {', '.join(REFERENCE_DATA['categories'])}."
                    ))

        return errors

    @classmethod
    def validate_episode(cls, episode: Episode, show_title: Optional[str] = None) -> List[ValidationErrorItem]:
        errors: List[ValidationErrorItem] = []
        title = episode.episode_title
        show_prefix = f"Show '{show_title}' / " if show_title else ""
        ep_label = f"{show_prefix}Episode '{title}' (S{episode.season.season_number if episode.season else '?'}E{episode.episode_number})"

        # Validate language
        if episode.language not in REFERENCE_DATA["languages"]:
            errors.append(ValidationErrorItem(
                entity_type="episode",
                entity_id=episode.id,
                entity_title=title,
                field="language",
                message=f"{ep_label} has invalid language '{episode.language}'. Allowed: {', '.join(REFERENCE_DATA['languages'])}."
            ))

        # Validate content_group
        if not episode.content_group or not episode.content_group.strip():
            errors.append(ValidationErrorItem(
                entity_type="episode",
                entity_id=episode.id,
                entity_title=title,
                field="content_group",
                message=f"{ep_label} must have a content_group identifier."
            ))

        # Validate publication readiness if episode is published
        if episode.status == "published":
            # Duration check
            if episode.duration_seconds is None or episode.duration_seconds <= 0:
                errors.append(ValidationErrorItem(
                    entity_type="episode",
                    entity_id=episode.id,
                    entity_title=title,
                    field="duration_seconds",
                    message=f"{ep_label} is published but has missing or invalid duration."
                ))

            # Artwork check (poster, banner, thumbnail)
            existing_artwork_types = {art.artwork_type for art in episode.artworks}
            required_types = {"poster", "banner", "thumbnail"}
            missing_types = required_types - existing_artwork_types

            for m in sorted(list(missing_types)):
                errors.append(ValidationErrorItem(
                    entity_type="artwork",
                    entity_id=episode.id,
                    entity_title=title,
                    field=m,
                    message=f"{ep_label} is missing required {m} artwork."
                ))

        return errors

    @classmethod
    def validate_for_publish(cls, db: Session) -> ValidationReport:
        errors: List[ValidationErrorItem] = []

        # Only validate shows that are published or have published content
        shows = db.query(Show).all()
        for show in shows:
            if show.status == "published":
                errors.extend(cls.validate_show(show))
            for season in show.seasons:
                for ep in season.episodes:
                    if ep.status == "published":
                        errors.extend(cls.validate_episode(ep, show_title=show.title))

        return ValidationReport(
            can_publish=(len(errors) == 0),
            total_issues=len(errors),
            errors=errors
        )
