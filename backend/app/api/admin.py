
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.dependencies import get_storage, require_admin, require_editor
from backend.app.db.session import get_db
from backend.app.models.publish_run import PublishRun
from backend.app.models.user import User
from backend.app.schemas.catalogue import PublishRunOut, ValidationReport
from backend.app.services.publish import PublishService
from backend.app.services.validation import ValidationService
from backend.app.storage.base import StorageBackend

router = APIRouter(prefix="/admin", tags=["Admin & Publishing"])

@router.get("/reference")
def get_reference_config(_user: Annotated[User, Depends(require_editor)]):
    return ValidationService.get_reference()

@router.get("/validation-report", response_model=ValidationReport)
def get_validation_report(
    db: Annotated[Session, Depends(get_db)],
    _user: Annotated[User, Depends(require_editor)]
):
    return ValidationService.validate_for_publish(db)

@router.post("/catalog/publish", response_model=PublishRunOut)
def publish_catalog(
    db: Annotated[Session, Depends(get_db)],
    storage: Annotated[StorageBackend, Depends(get_storage)],
    admin_user: Annotated[User, Depends(require_admin)]
):
    run_record = PublishService.publish_catalogue(
        db=db,
        storage=storage,
        triggered_by=admin_user.email
    )
    if run_record.status == "failed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "PUBLISH_FAILED",
                "message": run_record.error_message or "Catalogue publication failed",
                "errors": []
            }
        )
    return run_record

@router.get("/publish-runs", response_model=list[PublishRunOut])
def get_publish_history(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    _user: User = Depends(require_editor)
):
    return db.query(PublishRun).order_by(PublishRun.started_at.desc()).offset(skip).limit(limit).all()
