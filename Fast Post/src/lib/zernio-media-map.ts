import fs from "node:fs";
import path from "node:path";

const mediaMapPath = path.join(process.cwd(), "data", "zernio-media-map.json");

type MediaMapEntry = {
  storageKey: string;
  createdAt: string;
};

type MediaMap = Record<string, MediaMapEntry>;

export function rememberZernioStorageKey(zernioPostId: string | undefined, storageKey: string | undefined) {
  if (!zernioPostId || !storageKey) {
    return;
  }

  const mediaMap = readMediaMap();

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

export function forgetZernioStorageKey(zernioPostId: string | undefined) {
  if (!zernioPostId) {
    return;
  }

  const mediaMap = readMediaMap();

  if (!(zernioPostId in mediaMap)) {
    return;
  }

  delete mediaMap[zernioPostId];
  writeMediaMap(mediaMap);
}

function readMediaMap(): MediaMap {
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
  fs.mkdirSync(path.dirname(mediaMapPath), { recursive: true });
  fs.writeFileSync(mediaMapPath, JSON.stringify(mediaMap, null, 2));
}
