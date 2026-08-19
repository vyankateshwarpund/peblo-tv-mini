import json
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session, joinedload
from backend.app.models.show import Show
from backend.app.models.season import Season
from backend.app.models.episode import Episode
from backend.app.models.artwork import Artwork
from backend.app.storage.base import StorageBackend

class CatalogueService:
    @classmethod
    def generate_catalogue_dict(cls, db: Session, storage: StorageBackend) -> Dict[str, Any]:
        shows = (
            db.query(Show)
            .filter(Show.status == "published")
            .options(
                joinedload(Show.seasons).joinedload(Season.episodes).joinedload(Episode.artworks)
            )
            .order_by(Show.section, Show.title)
            .all()
        )

        sections: Dict[str, List[Dict[str, Any]]] = {}

        for show in shows:
            if not show.section:
                continue

            if show.section not in sections:
                sections[show.section] = []

            show_artworks: Dict[str, Optional[str]] = {
                "poster": None,
                "banner": None,
                "thumbnail": None
            }

            seasons_dict: Dict[int, Dict[str, Any]] = {}
            trailers_list: List[Dict[str, Any]] = []

            for season in sorted(show.seasons, key=lambda s: s.season_number):
                pub_episodes = [ep for ep in season.episodes if ep.status == "published"]
                if not pub_episodes and season.season_number != 0:
                    continue

                cg_groups: Dict[str, List[Episode]] = {}
                for ep in sorted(pub_episodes, key=lambda e: (e.episode_number, e.content_group)):
                    if ep.content_group not in cg_groups:
                        cg_groups[ep.content_group] = []
                    cg_groups[ep.content_group].append(ep)

                collapsed_episodes: List[Dict[str, Any]] = []

                for cg, group in cg_groups.items():
                    languages = sorted(list(set(e.language for e in group)))
                    primary_ep = group[0]

                    art_map: Dict[str, Optional[str]] = {
                        "poster": None,
                        "banner": None,
                        "thumbnail": None
                    }
                    for ep in group:
                        for art in ep.artworks:
                            if not art_map.get(art.artwork_type):
                                art_map[art.artwork_type] = storage.get_url(art.storage_key)
                                if not show_artworks.get(art.artwork_type):
                                    show_artworks[art.artwork_type] = storage.get_url(art.storage_key)

                    ep_data = {
                        "content_group": cg,
                        "episode_number": primary_ep.episode_number,
                        "title": primary_ep.episode_title,
                        "duration_seconds": primary_ep.duration_seconds,
                        "languages": languages,
                        "artwork": art_map
                    }

                    if season.season_number == 0:
                        trailers_list.append(ep_data)
                    else:
                        collapsed_episodes.append(ep_data)

                if season.season_number != 0 and collapsed_episodes:
                    seasons_dict[season.season_number] = {
                        "season_number": season.season_number,
                        "title": season.title or f"Season {season.season_number}",
                        "episodes": collapsed_episodes
                    }

            sorted_seasons = [seasons_dict[k] for k in sorted(seasons_dict.keys())]

            show_data = {
                "show_id": show.id,
                "title": show.title,
                "slug": show.slug,
                "synopsis": show.synopsis,
                "section": show.section,
                "categories": sorted(show.categories or []),
                "artwork": show_artworks,
                "seasons": sorted_seasons,
                "trailers": trailers_list
            }

            sections[show.section].append(show_data)

        for sec in sections:
            sections[sec] = sorted(sections[sec], key=lambda s: s["title"])

        catalogue = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "sections": sections
        }
        return catalogue

    @classmethod
    def search_catalogue(
        cls,
        catalogue: Dict[str, Any],
        q: Optional[str] = None,
        category: Optional[str] = None,
        language: Optional[str] = None,
        section: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        results = []
        q_clean = q.strip().lower() if q else None
        cat_clean = category.strip().lower() if category else None
        lang_clean = language.strip().lower() if language else None
        sec_clean = section.strip().lower() if section else None

        sections = catalogue.get("sections", {})
        for sec_name, shows in sections.items():
            if sec_clean and sec_name.lower() != sec_clean:
                continue

            for show in shows:
                if cat_clean:
                    show_cats = [c.lower() for c in show.get("categories", [])]
                    if cat_clean not in show_cats:
                        continue

                if lang_clean:
                    show_has_lang = False
                    for season in show.get("seasons", []):
                        for ep in season.get("episodes", []):
                            if lang_clean in [l.lower() for l in ep.get("languages", [])]:
                                show_has_lang = True
                                break
                        if show_has_lang:
                            break
                    if not show_has_lang:
                        for tr in show.get("trailers", []):
                            if lang_clean in [l.lower() for l in tr.get("languages", [])]:
                                show_has_lang = True
                                break
                    if not show_has_lang:
                        continue

                if q_clean:
                    show_title_match = q_clean in show.get("title", "").lower()
                    synopsis_match = q_clean in show.get("synopsis", "").lower()
                    cat_match = any(q_clean in c.lower() for c in show.get("categories", []))
                    
                    ep_title_match = False
                    for season in show.get("seasons", []):
                        for ep in season.get("episodes", []):
                            if q_clean in ep.get("title", "").lower():
                                ep_title_match = True
                                break
                        if ep_title_match:
                            break

                    if not (show_title_match or synopsis_match or cat_match or ep_title_match):
                        continue

                results.append(show)

        results.sort(key=lambda s: s.get("title", ""))
        return results
