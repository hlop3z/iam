#!/usr/bin/env bash

docker compose --env-file .env -f docker-compose.yml up -d --wait
