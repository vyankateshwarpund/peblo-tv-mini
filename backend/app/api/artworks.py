import io
import os
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from PIL import Image, UnidentifiedImageError
from sqlalchemy.orm import Session
from backend.app.core.dependencies import require_editor, get_storage
from backend.app.db.session import get_db
from backend.app.models.episode import Episode
from backend.app.models.artwork import Artwork
from backend.app.schemas.artwork import ArtworkOut
from backend.app.services.validation import ValidationService
from backend.app.storage.base import StorageBackend

router = APIRouter(prefix="/admin", tags=["Artwork Admin"])

MAX_FILE_SIZE_BYTES = 200 * 1024 # 200 KB

@router.post("/episodes/{episode_id}/artworks", response_model=ArtworkOut)
async def upload_artwork(
    episode_id: int,
    artwork_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
    _user = Depends(require_editor)
):
    episode = db.query(Episode).filter(Episode.id == episode_id).first()
    if not episode:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Episode with id {episode_id} not found", "errors": []}
        )

    ref = ValidationService.get_reference()
    if artwork_type not in ref["artwork_specs"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_ARTWORK_TYPE", "message": f"Unsupported artwork type '{artwork_type}'. Allowed: poster, banner, thumbnail.", "errors": []}
        )

    spec = ref["artwork_specs"][artwork_type]

    # 1. Read file bytes
    file_bytes = await file.read()
    file_size = len(file_bytes)

    # 2. Check file size <= 200 KB
    if file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "FILE_TOO_LARGE",
                "message": f"{artwork_type.capitalize()} image must be no larger than 200 KB (uploaded {file_size / 1024:.1f} KB).",
                "errors": []
            }
        )

    # 3. Verify it is a valid image using Pillow
    try:
        image = Image.open(io.BytesIO(file_bytes))
        image.verify() # Verify file header and integrity
        # Re-open for dimension inspection
        image = Image.open(io.BytesIO(file_bytes))
        width, height = image.size
        img_format = image.format or "JPEG"
    except (UnidentifiedImageError, Exception):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_IMAGE", "message": "Uploaded file is not a valid image.", "errors": []}
        )

    # 4. Aspect ratio check
    ratio = width / height
    if artwork_type == "poster":
        # Target 2:3 = 0.6666...
        expected_ratio = 2.0 / 3.0
        if not (0.60 <= ratio <= 0.72):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INVALID_ASPECT_RATIO",
                    "message": f"Poster must use a 2:3 aspect ratio (e.g. ~600x900px). Current: {width}x{height} (ratio {ratio:.2f}).",
                    "errors": []
                }
            )
    elif artwork_type in ["banner", "thumbnail"]:
        # Target 16:9 = 1.7777...
        expected_ratio = 16.0 / 9.0
        if not (1.60 <= ratio <= 1.95):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INVALID_ASPECT_RATIO",
                    "message": f"{artwork_type.capitalize()} must use a 16:9 aspect ratio. Current: {width}x{height} (ratio {ratio:.2f}).",
                    "errors": []
                }
            )

    # 5. Save image to storage
    extension = "jpg" if img_format.upper() in ["JPEG", "JPG"] else "png"
    storage_key = f"episodes/{episode_id}/{artwork_type}.{extension}"
    mime_type = file.content_type or f"image/{extension}"
    storage.save(storage_key, file_bytes, content_type=mime_type)

    # 6. Save or update DB record
    existing_art = db.query(Artwork).filter(
        Artwork.episode_id == episode_id,
        Artwork.artwork_type == artwork_type
    ).first()

    if existing_art:
        existing_art.storage_key = storage_key
        existing_art.width = width
        existing_art.height = height
        existing_art.file_size = file_size
        existing_art.mime_type = mime_type
        art_record = existing_art
    else:
        art_record = Artwork(
            episode_id=episode_id,
            artwork_type=artwork_type,
            storage_key=storage_key,
            width=width,
            height=height,
            file_size=file_size,
            mime_type=mime_type
        )
        db.add(art_record)

    db.commit()
    db.refresh(art_record)

    return ArtworkOut(
        id=art_record.id,
        episode_id=art_record.episode_id,
        artwork_type=art_record.artwork_type,
        storage_key=art_record.storage_key,
        url=storage.get_url(art_record.storage_key),
        width=art_record.width,
        height=art_record.height,
        file_size=art_record.file_size,
        mime_type=art_record.mime_type,
        created_at=art_record.created_at
    )

@router.delete("/artworks/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_artwork(
    id: int,
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
    _user = Depends(require_editor)
):
    art = db.query(Artwork).filter(Artwork.id == id).first()
    if not art:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Artwork with id {id} not found", "errors": []}
        )
    storage.delete(art.storage_key)
    db.delete(art)
    db.commit()
    return None
