"""Vercel entrypoint for the existing Geomatrix FastAPI application."""
import sys
from pathlib import Path

backend_root = Path(__file__).resolve().parents[1] / "geomatrix_v2"
sys.path.insert(0, str(backend_root))

from main import app

__all__ = ["app"]