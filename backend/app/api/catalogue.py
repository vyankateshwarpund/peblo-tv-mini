import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from backend.app.core.dependencies import get_storage
from backend.app.services.catalogue import CatalogueService
from backend.app.storage.base import StorageBackend

router = APIRouter(prefix="/catalog", tags=["Public Catalogue"])

@router.get("", response_model=Dict[str, Any])
def get_published_catalog(storage: StorageBackend = Depends(get_storage)):
    """
    Public endpoint serving ONLY the published catalogue JSON file.
    Does not query admin CRUD APIs or database.
    """
    if not storage.exists("catalogue.json"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CATALOGUE_NOT_PUBLISHED", "message": "Catalogue has not been published yet.", "errors": []}
        )
    
    try:
        content_bytes = storage.read_bytes("catalogue.json")
        return json.loads(content_bytes.decode("utf-8"))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "CATALOGUE_READ_ERROR", "message": f"Failed reading catalogue: {str(e)}", "errors": []}
        )

@router.get("/search", response_model=List[Dict[str, Any]])
def search_published_catalog(
    q: Optional[str] = None,
    category: Optional[str] = None,
    language: Optional[str] = None,
    section: Optional[str] = None,
    storage: StorageBackend = Depends(get_storage)
):
    """
    Public composable search across published catalogue.
    q matches show title, episode title, and category.
    """
    if not storage.exists("catalogue.json"):
        return []

    try:
        content_bytes = storage.read_bytes("catalogue.json")
        cat_data = json.loads(content_bytes.decode("utf-8"))
        return CatalogueService.search_catalogue(
            catalogue=cat_data,
            q=q,
            category=category,
            language=language,
            section=section
        )
    except Exception:
        return []
