import os
import shutil
import tempfile
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["JWT_SECRET"] = "test-secret-key-12345"

from backend.app.core.config import settings
from backend.app.db.base import Base
from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.core.security import get_password_hash
from backend.app.storage.local import LocalStorageBackend
from backend.app.core.dependencies import get_storage
from backend.app.main import app

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_temp.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def test_storage_dir():
    temp_dir = tempfile.mkdtemp(prefix="peblo_test_storage_")
    yield temp_dir
    shutil.rmtree(temp_dir, ignore_errors=True)

@pytest.fixture(scope="function")
def db_session(test_storage_dir):
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Create test users
    admin = User(
        email="admin@example.com",
        password_hash=get_password_hash("adminpassword123"),
        role="admin"
    )
    editor = User(
        email="editor@example.com",
        password_hash=get_password_hash("editorpassword123"),
        role="editor"
    )
    db.add(admin)
    db.add(editor)
    db.commit()

    yield db

    db.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session, test_storage_dir):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    def override_get_storage():
        return LocalStorageBackend(base_dir=test_storage_dir, public_url_prefix="/storage")

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_storage] = override_get_storage
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()

@pytest.fixture
def admin_token(client):
    res = client.post("/auth/login", json={"email": "admin@example.com", "password": "adminpassword123"})
    return res.json()["access_token"]

@pytest.fixture
def editor_token(client):
    res = client.post("/auth/login", json={"email": "editor@example.com", "password": "editorpassword123"})
    return res.json()["access_token"]
