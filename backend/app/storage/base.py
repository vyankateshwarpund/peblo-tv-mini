from abc import ABC, abstractmethod
from typing import Optional

class StorageBackend(ABC):
    """
    Abstract storage backend interface.
    Decouples business logic from filesystem APIs so local storage
    can be swapped with Cloudflare R2 / S3 without modifying core logic.
    """

    @abstractmethod
    def save(self, path: str, data: bytes, content_type: str = "application/octet-stream") -> str:
        """Save bytes to the specified relative path and return its key or URL."""
        pass

    @abstractmethod
    def delete(self, path: str) -> bool:
        """Delete an object at the specified path."""
        pass

    @abstractmethod
    def get_url(self, path: str) -> str:
        """Get a public / servable URL for the object."""
        pass

    @abstractmethod
    def exists(self, path: str) -> bool:
        """Check if an object exists at path."""
        pass

    @abstractmethod
    def read_bytes(self, path: str) -> bytes:
        """Read all bytes from the specified path."""
        pass

    @abstractmethod
    def atomic_replace(self, temp_path: str, target_path: str) -> None:
        """
        Atomically replace target_path with temp_path.
        Ensures readers never read partially written files.
        """
        pass
