# FastPost Deploy Runbook

## 1. Required Secrets

Set these in your deploy platform:

```bash
FASTPOST_SESSION_SECRET="long-random-value"
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."
FASTPOST_PUBLIC_BASE_URL="https://app.example.com"
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET="fastpost-media"
R2_PUBLIC_BASE_URL="https://media.example.com"
ZERNIO_API_KEY="sk_..."
ZERNIO_WEBHOOK_SECRET="long-random-value"
```

Optional email notifications:

```bash
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM=""
SMTP_SECURE="false"
```

## 2. Preflight

Run locally or in CI with production env vars loaded:

```bash
npm run readiness
npm audit --audit-level=high
npm run test
npm run build
```

## 3. Railway

Use a FastPost-specific Railway project and service. Do not deploy from a repo directory linked to another service.

```bash
railway login
railway link
railway service
railway variable set FASTPOST_PUBLIC_BASE_URL=https://your-app.up.railway.app
railway variable set ZERNIO_WEBHOOK_SECRET=...
railway up -d
railway status
railway logs
```

Add PostgreSQL and Redis services in Railway, then set `DATABASE_URL` and `REDIS_URL` from those services.

## 4. Cloudflare R2

Create a bucket, S3 API token, and public/custom domain.

Recommended object lifecycle:

- Prefix: `uploads/`
- Expiration: 7 to 14 days

FastPost deletes media on `post.published`; the lifecycle rule is only a safety net.

## 5. Zernio

Register this webhook:

```txt
https://your-app.example.com/api/webhooks/zernio
```

Enable:

- `post.published`
- `account.expired`

Use the same secret as `ZERNIO_WEBHOOK_SECRET`.

## 6. Smoke Test

1. Open `GET /api/settings/runtime` and confirm `productionReady: true`.
2. Upload a small video.
3. Confirm it lands in R2 under `uploads/`.
4. Create a Zernio post scheduled a few minutes ahead.
5. Wait for the `post.published` webhook.
6. Confirm the webhook response includes `cleanup: "deleted"`.
7. Confirm the R2 object is gone.

FastPost stores the cleanup fallback in Redis when `REDIS_URL` is configured. If Redis is unavailable, it falls back to `data/zernio-media-map.json`, which is why persistent `/app/data` storage is useful for single-instance deployments.

## 7. Rollback

Redeploy the previous commit or previous platform deployment. The changes in this project are backward-compatible with existing queued posts.
