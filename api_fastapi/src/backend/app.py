"""FastAPI application exposing an authenticated ping/pong endpoint."""

import dataclasses as dc

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .auth import CurrentUser
from .config import ALLOWED_ORIGINS

app = FastAPI(title="IAM backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PingRequest(BaseModel):
    message: str


class PingResponse(BaseModel):
    reply: str
    message: str
    user: str


@dc.dataclass
class User:
    db: dict
    id: str | None = None
    name: str | None = None
    email: str | None = None

    def __post_init__(self) -> None:
        self.name = self._display_name(self.db)
        self.email = self.db.get("email", "")
        self.id = self.db["sub"]

    @staticmethod
    def _display_name(user: dict) -> str:
        """Pick the friendliest identifier ZITADEL gave us for the signed-in user."""
        for claim in ("name", "preferred_username", "email", "sub"):
            value = user.get(claim)
            if value:
                return str(value)
        return "anonymous"


@app.get("/health")
def health() -> dict[str, str]:
    """Unauthenticated liveness probe."""
    return {"status": "ok"}


@app.post("/api/ping")
async def ping(body: PingRequest, user_db: CurrentUser) -> PingResponse:
    """Authenticated ping/pong: echo the message back with a `pong:` prefix.

    Requires a valid ZITADEL access token (Bearer), validated on every call.
    """
    user = User(user_db)

    return PingResponse(
        reply=f"pong: {body.message}",
        message=body.message,
        user=f"({user.id}) {user.name} => {user.email}",
    )
