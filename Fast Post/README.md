# FastPost

FastPost is a SaaS for automatic bulk scheduling of videos and images across Instagram, Facebook and TikTok.

The core product idea is simple: upload hundreds of media files, choose a profile and default posting times, then let FastPost distribute the queue across the next days, weeks or months.

## Stack

- Next.js 15, React 19, TypeScript
- TailwindCSS, Shadcn-compatible primitives, Lucide Icons
- FullCalendar
- Prisma and PostgreSQL
- Redis and BullMQ
- Cloudflare R2-ready storage settings
- Zernio service wrapper for social publishing

## Main Modules

- Dashboard
- Agendamento Rapido
- Calendario
- Perfis
- Contas sociais
- Biblioteca de midias
- Logs
- Configuracoes

## Core Scheduling Engine

The `SchedulingEngine` transforms uploaded media into scheduled posts.

It supports:

- active weekdays
- profile-specific schedule slots
- occupied slot skipping
- infinite queue generation
- refill continuation after the latest occupied slot
- single caption mode
- CSV-style per-file captions

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

On Windows, you can also run:

```bash
start-fastpost.cmd
```

## Demo Login

- Daniel / tokenize32
- Teste / fastpost-test-2026

The login uses a signed httpOnly cookie. Set `FASTPOST_SESSION_SECRET` in production.

## Tests

```bash
npm run test
```

## Prisma

```bash
cp .env.example .env
npx prisma generate
npx prisma db push
```

## Docker

```bash
docker compose up --build
```

## 24h Operation

For a simple always-on Node process, use PM2:

```bash
npm run build
pm2 start ecosystem.config.cjs
pm2 save
```

Healthcheck:

```txt
GET /api/health
```

For production, configure PostgreSQL, Redis, Cloudflare R2, Zernio API key, and webhook secret in environment variables. The **Configurações** screen shows which variables are still missing without exposing secret values.

## Important API Routes

- `POST /api/scheduling/preview`
- `POST /api/scheduling/confirm`
- `POST /api/webhooks/zernio`
- `GET /api/profiles`
- `POST /api/profiles`
- `POST /api/profiles/:id/clone`
- `GET /api/calendar`
- `GET /api/logs`

## Zernio

`src/lib/zernio.service.ts` centralizes:

- `connectAccount()`
- `syncAccounts()`
- `createPost()`
- `deletePost()`
- `getPost()`
- `getAnalytics()`
- `uploadMedia()`

To connect real Instagram, Facebook, or TikTok accounts:

1. Log in at `https://zernio.com`.
2. Create an API key in Settings -> API Keys.
3. Add it in the FastPost **Configurações** screen as either:
   - a global API key for every profile, or
   - a profile-specific API key for selected profiles.

You can also use `.env.local`:

```bash
ZERNIO_API_KEY="sk_..."
```

In **Contas**, click a platform button inside a profile. FastPost calls Zernio's connect URL endpoint and redirects the browser to Zernio OAuth. After authorizing, use the sync button on the profile to pull connected accounts/pages back into FastPost.

Local settings entered in the UI are saved to `data/local-settings.json`, which is ignored by git.
