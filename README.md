# MES Spawalnia

Time tracking on welding work orders and labour cost estimation.

## Structure

- `backend/` — Laravel 13 + Sail + PostgreSQL
- `frontend/` — React 19 + Vite

## Getting started

### Backend

Requires Docker only (no local PHP).

```bash
cd backend
cp .env.example .env
docker run --rm -u "$(id -u):$(id -g)" -v "$(pwd):/app" -w /app \
  composer:2.10 composer install --ignore-platform-req=ext-*
./vendor/bin/sail up -d
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate
```

The API is available at http://localhost:8000 (health check: `/up`).
