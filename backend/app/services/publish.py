import json
import logging
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from backend.app.models.publish_run import PublishRun
from backend.app.services.catalogue import CatalogueService
from backend.app.services.validation import ValidationService
from backend.app.storage.base import StorageBackend

logger = logging.getLogger(__name__)

class PublishService:
    @classmethod
    def publish_catalogue(
        cls,
        db: Session,
        storage: StorageBackend,
        triggered_by: str
    ) -> PublishRun:
        start_time = datetime.now(UTC)

        run_record = PublishRun(
            triggered_by=triggered_by,
            started_at=start_time,
            status="running"
        )
        db.add(run_record)
        db.commit()
        db.refresh(run_record)

        try:
            report = ValidationService.validate_for_publish(db)
            if not report.can_publish:
                error_summary = f"Publication blocked with {report.total_issues} issues: " + "; ".join(
                    [f"{e.entity_type} {e.entity_title or ''} ({e.field}: {e.message})" for e in report.errors[:5]]
                )
                run_record.status = "failed"
                run_record.completed_at = datetime.now(UTC)
                run_record.error_message = error_summary
                db.commit()
                db.refresh(run_record)
                return run_record

            catalogue_data = CatalogueService.generate_catalogue_dict(db, storage)
            catalogue_json = json.dumps(catalogue_data, indent=2, ensure_ascii=False)
            catalogue_bytes = catalogue_json.encode("utf-8")

            show_count = sum(len(shows) for shows in catalogue_data.get("sections", {}).values())
            episode_count = 0
            for shows in catalogue_data.get("sections", {}).values():
                for s in shows:
                    for season in s.get("seasons", []):
                        episode_count += len(season.get("episodes", []))
                    episode_count += len(s.get("trailers", []))

            temp_key = "catalogue.json.tmp"
            target_key = "catalogue.json"
            storage.save(temp_key, catalogue_bytes, content_type="application/json")

            storage.atomic_replace(temp_key, target_key)

            run_record.status = "success"
            run_record.completed_at = datetime.now(UTC)
            run_record.published_show_count = show_count
            run_record.published_episode_count = episode_count
            run_record.error_message = None
            db.commit()
            db.refresh(run_record)
            return run_record

        except Exception as ex:
            logger.exception("Error during catalogue publish")
            run_record.status = "failed"
            run_record.completed_at = datetime.now(UTC)
            run_record.error_message = str(ex)
            db.commit()
            db.refresh(run_record)
            return run_record
