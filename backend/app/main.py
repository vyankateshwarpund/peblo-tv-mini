from pathlib import Path

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from backend.app.api import admin, artworks, auth, catalogue, episodes, seasons, shows
from backend.app.core.config import settings
from backend.app.db.session import engine

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Peblo TV Mini API - Internal CMS and Public Catalogue Pipeline"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for local storage
storage_dir = Path(settings.STORAGE_PATH).resolve()
storage_dir.mkdir(parents=True, exist_ok=True)
app.mount("/storage", StaticFiles(directory=str(storage_dir)), name="storage")

# Include Routers
app.include_router(auth.router)
app.include_router(shows.router)
app.include_router(seasons.router)
app.include_router(episodes.router)
app.include_router(artworks.router)
app.include_router(catalogue.router)
app.include_router(admin.router)

@app.get("/health", tags=["Health"])
def health_check():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "error", "database": str(e)}
        )
