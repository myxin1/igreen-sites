import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { forgetZernioStorageKey, readZernioStorageKey, rememberZernioStorageKey } from "./zernio-media-map";

let testDir = "";
let mediaMapPath = "";

beforeEach(() => {
  testDir = fs.mkdtempSync(path.join(os.tmpdir(), "fastpost-media-map-"));
  mediaMapPath = path.join(testDir, "zernio-media-map.json");
  process.env.FASTPOST_ZERNIO_MEDIA_MAP_PATH = mediaMapPath;
});

afterEach(() => {
  delete process.env.FASTPOST_ZERNIO_MEDIA_MAP_PATH;
  fs.rmSync(testDir, { recursive: true, force: true });
});

describe("zernio media map", () => {
  it("remembers, reads, and forgets storage keys by Zernio post ID", async () => {
    await rememberZernioStorageKey("zernio-one", "uploads/video-one.mp4");

    expect(readZernioStorageKey("zernio-one")).toBe("uploads/video-one.mp4");

    forgetZernioStorageKey("zernio-one");

    expect(readZernioStorageKey("zernio-one")).toBeUndefined();
  });

  it("prunes stale entries when remembering a new storage key", async () => {
    fs.mkdirSync(path.dirname(mediaMapPath), { recursive: true });
    fs.writeFileSync(
      mediaMapPath,
      JSON.stringify({
        stale: {
          storageKey: "uploads/stale.mp4",
          createdAt: "2000-01-01T00:00:00.000Z"
        }
      })
    );

    await rememberZernioStorageKey("fresh", "uploads/fresh.mp4");

    expect(readZernioStorageKey("stale")).toBeUndefined();
    expect(readZernioStorageKey("fresh")).toBe("uploads/fresh.mp4");
  });
});
