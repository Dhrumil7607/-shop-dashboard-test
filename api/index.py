"""Vercel serverless entrypoint for the FastAPI backend."""

from pathlib import Path
import sys

ROOT_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT_DIR / "backend"

sys.path.insert(0, str(BACKEND_DIR))

from server import app  # noqa: E402,F401
