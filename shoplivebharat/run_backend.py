import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / ".venv" / "Lib" / "site-packages"))
sys.path.insert(0, str(ROOT / "backend"))

import uvicorn

uvicorn.run("server:app", host="127.0.0.1", port=8000)
