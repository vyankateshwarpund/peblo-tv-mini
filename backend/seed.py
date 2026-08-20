import json
import os
import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.core.config import settings
from backend.app.core.security import get_password_hash
from backend.app.db.session import SessionLocal, engine
from backend.app.db.base import Base
from backend.app.models.user import User
from backend.app.models.show import Show
from backend.app.models.season import Season
from backend.app.models.episode import Episode
from backend.app.models.artwork import Artwork
from backend.app.storage.local import LocalStorageBackend

def seed_database():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    storage = LocalStorageBackend(base_dir=settings.STORAGE_PATH, public_url_prefix="/storage")

    try:
        # 1. Seed Users
        print("Seeding users...")
        admin = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
        if not admin:
            admin = User(
                email=settings.ADMIN_EMAIL,
                password_hash=get_password_hash(settings.ADMIN_PASSWORD),
                role="admin"
            )
            db.add(admin)
            print(f"Created admin user: {settings.ADMIN_EMAIL}")

        editor = db.query(User).filter(User.email == settings.EDITOR_EMAIL).first()
        if not editor:
            editor = User(
                email=settings.EDITOR_EMAIL,
                password_hash=get_password_hash(settings.EDITOR_PASSWORD),
                role="editor"
            )
            db.add(editor)
            print(f"Created editor user: {settings.EDITOR_EMAIL}")
        db.commit()

        # 2. Locate seed data files
        seed_dir = Path(__file__).resolve().parent.parent / "seed"
        if not seed_dir.exists():
            seed_dir = Path("./seed")
        
        seed_shows_file = seed_dir / "seed_shows.json"
        if not seed_shows_file.exists():
            print(f"Seed file not found: {seed_shows_file}")
            return

        with open(seed_shows_file, "r", encoding="utf-8") as f:
            episodes_data = json.load(f)

        print(f"Loaded {len(episodes_data)} episode records from seed_shows.json.")

        # Prepare default artwork binaries from assets/ if available
        assets_dir = Path(__file__).resolve().parent.parent / "assets"
        sample_art_bytes = {}
        for art_name, file_name, w, h, mime in [
            ("poster", "poster_good.jpg", 600, 900, "image/jpeg"),
            ("banner", "banner_good.jpg", 1280, 720, "image/jpeg"),
            ("thumbnail", "thumb_good.jpg", 640, 360, "image/jpeg")
        ]:
            asset_path = assets_dir / file_name
            if asset_path.exists():
                with open(asset_path, "rb") as af:
                    sample_art_bytes[art_name] = (af.read(), w, h, mime)

        # 3. Seed Shows, Seasons, Episodes
        shows_cache = {}
        seasons_cache = {}

        seeded_ep_count = 0
        skipped_or_resolved_dupes = 0

        for ep_data in episodes_data:
            slug = ep_data["slug"]
            show_title = ep_data["show_title"]
            section = ep_data.get("section")
            categories = ep_data.get("categories", [])
            synopsis = ep_data.get("synopsis", "")
            status = ep_data.get("status", "draft")

            # Check or create Show
            if slug not in shows_cache:
                show = db.query(Show).filter(Show.slug == slug).first()
                if not show:
                    show = Show(
                        title=show_title,
                        slug=slug,
                        synopsis=synopsis,
                        section=section,
                        categories=categories,
                        status="draft" if section is None else status
                    )
                    db.add(show)
                    db.flush()
                shows_cache[slug] = show
            show = shows_cache[slug]

            # Check or create Season
            season_num = ep_data.get("season_number", 1)
            season_key = (show.id, season_num)
            if season_key not in seasons_cache:
                season = db.query(Season).filter(
                    Season.show_id == show.id,
                    Season.season_number == season_num
                ).first()
                if not season:
                    season_title = "Trailers" if season_num == 0 else f"Season {season_num}"
                    season = Season(
                        show_id=show.id,
                        season_number=season_num,
                        title=season_title
                    )
                    db.add(season)
                    db.flush()
                seasons_cache[season_key] = season
            season = seasons_cache[season_key]

            # Check duplicate (content_group, language)
            cg = ep_data["content_group"]
            lang = ep_data["language"]
            ep_num = ep_data.get("episode_number", 1)
            ep_title = ep_data.get("episode_title", "Untitled")
            
            existing_ep = db.query(Episode).filter(
                Episode.content_group == cg,
                Episode.language == lang
            ).first()

            if existing_ep:
                if existing_ep.season_id == season.id and existing_ep.episode_number == ep_num:
                    # Already seeded
                    continue
                # Handle deliberate seed imperfection (e.g. ep_9001 conflicting with ep_0004)
                print(f"Notice: Duplicate (content_group='{cg}', language='{lang}') detected on '{ep_title}'. Storing with conflict suffix.")
                cg = f"{cg}-conflict-{ep_data.get('episode_id', 'dup')}"
                skipped_or_resolved_dupes += 1

                existing_conflict = db.query(Episode).filter(
                    Episode.content_group == cg,
                    Episode.language == lang
                ).first()
                if existing_conflict:
                    continue

            # Create Episode
            episode = Episode(
                season_id=season.id,
                episode_number=ep_num,
                episode_title=ep_title,
                duration_seconds=ep_data.get("duration_seconds"),
                language=lang,
                content_group=cg,
                status=ep_data.get("status", "draft")
            )
            db.add(episode)
            db.flush()
            seeded_ep_count += 1

            # Seed Artwork if listed in artwork_available
            art_avail = ep_data.get("artwork_available", [])
            for art_type in art_avail:
                if art_type in sample_art_bytes:
                    data, w, h, mime = sample_art_bytes[art_type]
                    ext = "jpg"
                    storage_key = f"episodes/{episode.id}/{art_type}.{ext}"
                    storage.save(storage_key, data, content_type=mime)

                    art_rec = Artwork(
                        episode_id=episode.id,
                        artwork_type=art_type,
                        storage_key=storage_key,
                        width=w,
                        height=h,
                        file_size=len(data),
                        mime_type=mime
                    )
                    db.add(art_rec)

        db.commit()
        print(f"Successfully seeded {len(shows_cache)} shows and {seeded_ep_count} episodes ({skipped_or_resolved_dupes} duplicate conflicts resolved).")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
