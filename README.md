# MES Spawalnia

Time tracking on welding work orders and labour cost estimation.

## Structure

- `backend/` — Laravel 13 + Sail + PostgreSQL
- `frontend/` — React 19 + Vite + TanStack Router and Query

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

### Frontend

Requires Node 24.

```bash
cd frontend
npm ci --ignore-scripts
npm run dev
```

The app is available at http://localhost:5173; `/api` and `/sanctum` are proxied to the backend on port 8000.

Testing the camera on a phone needs HTTPS on the local network (for example `vite --host` with `@vitejs/plugin-basic-ssl`).

## Verification

```bash
cd backend
./vendor/bin/sail composer check   # Pint, Larastan, Pest

cd ../frontend
npm run check                      # Biome, TypeScript, Vitest
npm run build
```
