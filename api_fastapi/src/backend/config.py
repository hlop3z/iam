"""Runtime configuration, read from the environment.

Mirrors the values the Next.js BFF uses (see gui_nextjs/services/zitadel.server.ts)
so both sides agree on which ZITADEL instance issues and validates tokens.
"""

import os

# Base URL of the ZITADEL instance that issues access tokens.
ZITADEL_ISSUER = os.environ.get("ZITADEL_ISSUER", "http://localhost:8080").rstrip("/")

# OIDC userinfo endpoint — accepts a Bearer access token and returns the user's
# claims when the token is valid. Used here to authenticate API requests.
USERINFO_ENDPOINT = f"{ZITADEL_ISSUER}/oidc/v1/userinfo"

# Origins allowed to call this API directly from the browser (CORS). The Next.js
# BFF calls server-to-server (no CORS needed), but allowing the GUI origin keeps
# direct browser calls working too. Comma-separated; defaults to the dev GUI.
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]
