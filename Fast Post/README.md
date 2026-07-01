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

Runtime readiness:

```txt
GET /api/settings/runtime
```

This endpoint returns boolean readiness flags, the expected Zernio webhook URL, and the media cleanup mode without exposing secret values.

## Production Media Cleanup

FastPost stores uploaded media in Cloudflare R2, sends the public URL to Zernio, and deletes the R2 object after a `post.published` webhook.

Required environment variables:

```bash
FASTPOST_PUBLIC_BASE_URL="https://app.example.com"
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET="fastpost-media"
R2_PUBLIC_BASE_URL="https://media.example.com"
ZERNIO_API_KEY="sk_..."
ZERNIO_WEBHOOK_SECRET="replace-me-with-a-long-random-secret"
```

Zernio webhook:

```txt
https://app.example.com/api/webhooks/zernio
```

Enable at least:

- `post.published`
- `account.expired`

Webhook signatures are validated with HMAC-SHA256 using `ZERNIO_WEBHOOK_SECRET`. Accepted signature formats are `sha256=<hex>`, `v1=<hex>`, or raw hex.

Cleanup fallback:

- FastPost sends `metadata.storageKey` to Zernio when creating posts.
- If Zernio returns `data.storageKey` in the webhook, FastPost deletes that R2 object.
- If Zernio does not return metadata, FastPost falls back to `data/zernio-media-map.json` using `externalId`/`postId`.
- Local fallback entries are pruned after 14 days.

Recommended R2 safety net:

- Add a Cloudflare R2 lifecycle rule for prefix `uploads/`.
- Expire objects after 7 to 14 days.

End-to-end smoke test:

1. Configure the environment variables above.
2. Upload a small test video.
3. Create a Zernio post scheduled a few minutes in the future.
4. Confirm the object exists in R2 under `uploads/`.
5. Wait for the Zernio `post.published` webhook.
6. Confirm `/api/webhooks/zernio` returns `cleanup: "deleted"` or `cleanup: "skipped"` only if the object was already gone.
7. Confirm the object was removed from R2.

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
