# Max Edit — Backend

Max Edit is a batch video editing SaaS backend built with Node.js, TypeScript, Express, Prisma, SQLite (MVP), Redis, BullMQ and FFmpeg.

## Requirements

- Docker & Docker Compose
- Node 20.19+
- ffmpeg (in Dockerfile installed)

## Install (local)

1. Copy `.env.example` to `.env` and adjust.
2. Install dependencies:

```bash
npm install
```

3. Generate Prisma client and initialize the local SQLite database:

```bash
npm run prisma:generate
npm run db:init
```

4. Start API in dev:

```bash
npm run dev
```

Start worker in another terminal:

```bash
node ./dist/workers/index.js
# or for dev
ts-node-dev src/workers/index.ts
```

## Docker

Start API + Redis:

```bash
docker-compose up --build
```

## FFmpeg

FFmpeg is required for rendering and previews. The Dockerfile installs `ffmpeg`.

## Storage structure

- `storage/templates/` - stored template assets
- `storage/uploads/` - uploaded source videos
- `storage/renders/` - rendered outputs
- `storage/previews/` - preview images
- `storage/zips/` - batch zip outputs

## Endpoints

- Templates
  - `POST /api/templates` - create template (multipart `video`)
  - `POST /api/templates/upload` - upload file
  - `GET /api/templates` - list
  - `GET /api/templates/:id` - get
  - `PATCH /api/templates/:id` - update
  - `DELETE /api/templates/:id` - delete
  - `POST /api/templates/:id/placeholder` - create placeholder
  - `PATCH /api/templates/:id/placeholder` - update placeholder
  - `GET /api/templates/:id/placeholder` - list placeholders
  - `POST /api/templates/:id/elements` - create element
  - `GET /api/templates/:id/elements` - list elements
  - `PATCH /api/templates/:id/elements/:elementId` - update element
  - `DELETE /api/templates/:id/elements/:elementId` - delete element
  - `POST /api/templates/:id/preview` - generate preview image (PNG)

- Batches
  - `POST /api/batches` - create batch
  - `GET /api/batches` - list
  - `GET /api/batches/:id` - get
  - `POST /api/batches/:id/videos` - upload many videos (multipart `videos`)
  - `GET /api/batches/:id/videos` - list videos in batch
  - `DELETE /api/videos/:id` - delete source video
  - `POST /api/batches/:id/render` - start render for all videos in batch (body: `{ templateId }`)
  - `GET /api/batches/:id/progress` - get render progress
  - `GET /api/batches/:id/download-zip` - download ZIP of completed renders

- Renders
  - `GET /api/renders/:id/download` - download single render

- Health
  - `GET /health`

## Notes & future

The architecture is modular and prepared for future integration: subtitles, AI title generation, auto publishing, Canva API, background removal, TTS. Expand `ffmpeg.service.ts` for richer layer handling, drawtext configurations and advanced filter graphs.

## Example cURL

Create a template (upload video):

```bash
curl -F "video=@/path/to/canva.mp4" -F "name=My Template" http://localhost:4000/api/templates
```

Create a batch:

```bash
curl -X POST -H "Content-Type: application/json" -d '{"name":"batch-1"}' http://localhost:4000/api/batches
```

Upload videos to batch:

```bash
curl -F "videos=@/path/a.mp4" -F "videos=@/path/b.mp4" http://localhost:4000/api/batches/<batchId>/videos
```

Start render:

```bash
curl -X POST -H "Content-Type: application/json" -d '{"templateId":"<templateId>"}' http://localhost:4000/api/batches/<batchId>/render
```

Download zip when completed:

```bash
curl -O http://localhost:4000/api/batches/<batchId>/download-zip
```

