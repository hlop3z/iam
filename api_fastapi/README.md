# backend (FastAPI)

A small FastAPI service with a single authenticated endpoint, gated by a
ZITADEL user account.

## Endpoints

| Method | Path        | Auth            | Description                              |
| ------ | ----------- | --------------- | ---------------------------------------- |
| GET    | `/health`   | none            | Liveness probe.                          |
| POST   | `/api/ping` | ZITADEL Bearer  | Ping/pong — echoes `message` as `pong:`. |

`/api/ping` requires a valid ZITADEL access token in the `Authorization: Bearer`
header. The token is validated on every call against ZITADEL's userinfo
endpoint, so it works with both opaque and JWT access tokens and needs no client
secret.

Request body:

```json
{ "message": "hello" }
```

Response:

```json
{ "reply": "pong: hello", "message": "hello", "user": "Jane Doe" }
```

## Run

```bash
uv sync
uv run fastapi dev main.py   # http://localhost:8000
```

## Configuration (env)

| Variable          | Default                  | Description                                  |
| ----------------- | ------------------------ | -------------------------------------------- |
| `ZITADEL_ISSUER`  | `http://localhost:8080`  | Base URL of the ZITADEL instance.            |
| `ALLOWED_ORIGINS` | `http://localhost:3000`  | Comma-separated CORS origins for the GUI.    |

The Next.js GUI reaches this API through its BFF route `/api/ping`, which
attaches the signed-in user's access token. See `gui_nextjs/app/ping/page.tsx`.
