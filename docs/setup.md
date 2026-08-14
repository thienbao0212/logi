# Setup

1. Install Node from `.nvmrc` (nvm recommended)
2. Docker Desktop running
3. `cp .env.example .env`
4. `npm ci`
5. `docker compose up -d`
6. `npm run db:migrate && npm run db:fixtures`
7. `npm run dev`
8. Open the app host from `.env` (APP_HOST)

Smoke: health endpoint 200; sign-in with a fixtures user.
