"""Entrypoint for the FastAPI app.

Run the dev server with:

    uv run fastapi dev main.py

`fastapi`/`uvicorn` discover the `app` object below.
"""

from backend import app

__all__ = ["app"]
