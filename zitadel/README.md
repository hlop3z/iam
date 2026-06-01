# ZITADEL

**Default login (local):** <http://localhost:8080>

- admin: <http://localhost:8080/ui/console>
- user: `zitadel-admin@zitadel.localhost`
- pass: `Password1!`

## Apps

- **Redirect URI** = "Where should ZITADEL send the user after login?"
- **Post Logout URI** = "Where should ZITADEL send the user after logout?"

## Docker

Self-hosted [ZITADEL](https://zitadel.com) identity stack, fronted by Traefik.
Two compose files are provided:

| File                                                 | Purpose           | Database                    |
| ---------------------------------------------------- | ----------------- | --------------------------- |
| [`docker-compose.yml`](docker-compose.yml)           | Local development | Bundled Postgres container  |
| [`docker-compose.prod.yml`](docker-compose.prod.yml) | Production        | External / managed Postgres |

Both read configuration from an env file (`.env`). Copy [`.env.example`](.env.example)
to `.env` and adjust before running.

## Services

- **proxy** — Traefik, routes HTTP/gRPC traffic and (optionally) terminates TLS.
- **zitadel-api** — the ZITADEL API and console.
- **zitadel-login** — the v2 login UI, served under `/ui/v2/login`.
- **postgres** — bundled database (local compose only).
- **redis** — optional cache, enable with `--profile cache`.
- **otel-collector** — optional tracing, enable with `--profile observability`.

---

## Local development

The defaults in `.env` are wired for a plain `localhost` HTTP stack — no TLS,
no real domain, default Postgres credentials. **Insecure by design; never expose
this to a network.**

```powershell
docker compose --env-file .env -f docker-compose.yml up -d --wait
```

Then open <http://localhost:8080>. First-run admin credentials are ZITADEL's
defaults (`zitadel-admin@zitadel.localhost` / `Password1!`).

Requirements:

- **Docker Desktop** running (the whole stack is containerized).
- `genkey.sh` (used to generate a fresh masterkey/passwords) is a Bash + `uv`
  script — run it from Git Bash or WSL, not PowerShell. You don't need it to
  start locally; `.env` ships a working 32-char masterkey.

Stop the stack:

```powershell
docker compose --env-file .env -f docker-compose.yml down
```

---

## Production (external Postgres)

`docker-compose.prod.yml` is a **standalone alternative** to the local file (not
an overlay — use it on its own). It is identical except that Postgres lives
outside the stack:

- The `postgres` service is removed.
- The `postgres-data` volume is removed.
- `zitadel-api` no longer depends on a local database.

ZITADEL connects purely via the DSN in your env file. Point it at your managed
Postgres (RDS, Cloud SQL, etc.) with TLS enabled:

```
ZITADEL_DATABASE_POSTGRES_DSN=postgresql://zitadel:<password>@db.example.com:5432/zitadel?sslmode=require
```

- The role in the DSN must already exist and, on first run (`start-from-init`),
  be able to create and own the schema.
- For production, scope it to a non-superuser role with only the permissions
  ZITADEL needs.
- Use `sslmode=require` (or stricter) for a remote database — not `disable`.

Run it:

```powershell
docker compose --env-file .env -f docker-compose.prod.yml up -d --wait
```

### Before going live

Two things are still on you (outside the database setup):

1. **`ZITADEL_MASTERKEY`** — replace the shipped 32-char default with a secret
   one (must be exactly 32 characters). Rotating this later requires a
   re-encryption step, so set it before the first run.
2. **TLS at the edge** — the `websecure` routers have `tls=true` but no cert
   resolver is configured, so Traefik serves a self-signed certificate.
   Either terminate TLS upstream (load balancer) or add a Let's Encrypt resolver
   to the `proxy` service. The `.env` already has `LETSENCRYPT_EMAIL` and
   `TRAEFIK_TRUSTED_IPS` placeholders for that setup.

When TLS is in place, set in `.env`:

```
ZITADEL_EXTERNALSECURE=true
ZITADEL_PUBLIC_SCHEME=https
ZITADEL_DOMAIN=your-domain.example.com
```

---

## Optional profiles

Enabled on top of either compose file:

```powershell
# Redis cache — also set ZITADEL_CACHES_*_CONNECTOR=redis in .env
docker compose --env-file .env -f docker-compose.prod.yml --profile cache up -d --wait

# OTEL tracing — requires otel-collector-config.yaml in this folder
docker compose --env-file .env -f docker-compose.prod.yml --profile observability up -d --wait
```

> **Note:** the `observability` profile mounts `./otel-collector-config.yaml`,
> which is not included in this folder. Create it before enabling the profile.

---

## Upgrading ZITADEL

Bump `ZITADEL_VERSION` (and any image tags) in `.env`, then:

```powershell
docker compose --env-file .env -f docker-compose.yml pull
docker compose --env-file .env -f docker-compose.yml up -d --wait
```

Use `-f docker-compose.prod.yml` instead for the production stack.
