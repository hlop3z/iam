#!/usr/bin/env bash

set -euo pipefail

SIZE="${1:-32}"

uv run python - "$SIZE" <<'PY'
import json
import secrets
import string
import sys

size = int(sys.argv[1])

alphabet = string.ascii_letters + string.digits
key = ''.join(secrets.choice(alphabet) for _ in range(size))

print(json.dumps({"key": key}))
PY