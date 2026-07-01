import fs from "node:fs";
import path from "node:path";
import Redis from "ioredis";

const defaultMediaMapPath = path.join(process.cwd(), "data", "zernio-media-map.json");
const defaultRetentionDays = 14;
const redisKeyPrefix = "fastpost:zernio-media:";
const redisRetentionSeconds = defaultRetentionDays * 24 * 60 * 60;
let redisClient: Redis | null | undefined;

type MediaMapEntry = {
  storageKey: string;
  createdAt: string;
};

type MediaMap = Record<string, MediaMapEntry>;

export async function rememberZernioStorageKey(zernioPostId: string | undefined, storageKey: string | undefined) {
  if (!zernioPostId || !storageKey) {
    return;
  }

  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.set(redisKey(zernioPostId), storageKey, "EX", redisRetentionSeconds);
      return;
    } catch {
      // Fall back to local storage when Redis is temporarily unavailable.
    }
  }

  const mediaMap = readMediaMap();
  pruneMediaMap(mediaMap);

  mediaMap[zernioPostId] = {
    storageKey,
    createdAt: new Date().toISOString()
  };

  writeMediaMap(mediaMap);
}

export function readZernioStorageKey(zernioPostId: string | undefined) {
  if (!zernioPostId) {
    return undefined;
  }

  return readMediaMap()[zernioPostId]?.storageKey;
}

export async function readZernioStorageKeyAsync(zernioPostId: string | undefined) {
  if (!zernioPostId) {
    return undefined;
  }

  const redis = getRedisClient();
  if (!redis) {
    return readZernioStorageKey(zernioPostId);
  }

  return (await redis.get(redisKey(zernioPostId))) ?? undefined;
}

export function forgetZernioStorageKey(zernioPostId: string | undefined) {
  if (!zernioPostId) {
    return;
  }

  const redis = getRedisClient();
  if (redis) {
    redis.del(redisKey(zernioPostId)).catch(() => undefined);
  }

  const mediaMap = readMediaMap();

  if (!(zernioPostId in mediaMap)) {
    return;
  }

  delete mediaMap[zernioPostId];
  writeMediaMap(mediaMap);
}

function readMediaMap(): MediaMap {
  const mediaMapPath = currentMediaMapPath();

  if (!fs.existsSync(mediaMapPath)) {
    return {};
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(mediaMapPath, "utf8")) as unknown;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).flatMap(([zernioPostId, entry]) => {
        if (!entry || typeof entry !== "object") {
          return [];
        }

        const record = entry as Record<string, unknown>;

        return typeof record.storageKey === "string"
          ? [
              [
                zernioPostId,
                {
                  storageKey: record.storageKey,
                  createdAt: typeof record.createdAt === "string" ? record.createdAt : ""
                }
              ]
            ]
          : [];
      })
    );
  } catch {
    return {};
  }
}

function writeMediaMap(mediaMap: MediaMap) {
  const mediaMapPath = currentMediaMapPath();

  fs.mkdirSync(path.dirname(mediaMapPath), { recursive: true });
  fs.writeFileSync(mediaMapPath, JSON.stringify(mediaMap, null, 2));
}

function currentMediaMapPath() {
  return process.env.FASTPOST_ZERNIO_MEDIA_MAP_PATH || defaultMediaMapPath;
}

function pruneMediaMap(mediaMap: MediaMap, now = Date.now(), retentionDays = defaultRetentionDays) {
  const oldestAllowed = now - retentionDays * 24 * 60 * 60 * 1000;

  Object.entries(mediaMap).forEach(([zernioPostId, entry]) => {
    const createdAt = new Date(entry.createdAt).getTime();

    if (!Number.isFinite(createdAt) || createdAt < oldestAllowed) {
      delete mediaMap[zernioPostId];
    }
  });
}

function getRedisClient() {
  if (!process.env.REDIS_URL) {
    return null;
  }

  if (redisClient === undefined) {
    redisClient = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false
    });
  }

  return redisClient;
}

function redisKey(zernioPostId: string) {
  return `${redisKeyPrefix}${zernioPostId}`;
}
