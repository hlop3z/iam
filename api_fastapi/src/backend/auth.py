"""ZITADEL bearer-token authentication for FastAPI.

Tokens are validated by calling ZITADEL's userinfo endpoint. This works with
both opaque and JWT access tokens and needs no client secret: if ZITADEL accepts
the token it returns the user's claims, otherwise the request is rejected.
"""

from typing import Annotated, Any

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import USERINFO_ENDPOINT

bearer_scheme = HTTPBearer(auto_error=True)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
) -> dict[str, Any]:
    """Resolve the ZITADEL user behind the request's Bearer token.

    Returns the user's claims (sub, name, email, …) on success. Raises 401 if the
    token is missing/invalid/expired, or 502 if ZITADEL can't be reached.
    """
    token = credentials.credentials
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(
                USERINFO_ENDPOINT,
                headers={"Authorization": f"Bearer {token}"},
            )
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to reach the identity provider",
        ) from exc

    if res.status_code != status.HTTP_200_OK:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return res.json()


CurrentUser = Annotated[dict[str, Any], Depends(get_current_user)]
