import os
import shutil
from pathlib import Path
from backend.app.storage.base import StorageBackend

class LocalStorageBackend(StorageBackend):
    def __init__(self, base_dir: str = "./storage", public_url_prefix: str = "/storage"):
        self.base_dir = Path(base_dir).resolve()
        self.public_url_prefix = public_url_prefix.rstrip("/")
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _resolve(self, relative_path: str) -> Path:
        rel = relative_path.lstrip("/\\")
        target = (self.base_dir / rel).resolve()
        if not str(target).startswith(str(self.base_dir)):
            raise ValueError(f"Directory traversal detected for path: {relative_path}")
        return target

    def save(self, path: str, data: bytes, content_type: str = "application/octet-stream") -> str:
        target = self._resolve(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        with open(target, "wb") as f:
            f.write(data)
        return path.replace("\\", "/").lstrip("/")

    def delete(self, path: str) -> bool:
        try:
            target = self._resolve(path)
            if target.is_file():
                target.unlink()
                return True
        except Exception:
            return False
        return False

    def get_url(self, path: str) -> str:
        normalized = path.replace("\\", "/").lstrip("/")
        return f"{self.public_url_prefix}/{normalized}"

    def exists(self, path: str) -> bool:
        try:
            target = self._resolve(path)
            return target.is_file()
        except Exception:
            return False

    def read_bytes(self, path: str) -> bytes:
        target = self._resolve(path)
        if not target.is_file():
            raise FileNotFoundError(f"File not found: {path}")
        with open(target, "rb") as f:
            return f.read()

    def atomic_replace(self, temp_path: str, target_path: str) -> None:
        src = self._resolve(temp_path)
        dst = self._resolve(target_path)
        if not src.is_file():
            raise FileNotFoundError(f"Source temp file does not exist: {temp_path}")
        dst.parent.mkdir(parents=True, exist_ok=True)
        # os.replace is atomic on POSIX and Windows NTFS
        os.replace(src, dst)
