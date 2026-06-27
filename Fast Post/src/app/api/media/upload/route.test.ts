import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("POST /api/media/upload", () => {
  it("stores an uploaded media file and returns its public URL", async () => {
    const form = new FormData();

    form.set("file", new File([new Uint8Array([1, 2, 3])], "Vídeo Teste.mp4", { type: "video/mp4" }));

    const response = await POST(
      new Request("http://localhost:3000/api/media/upload", {
        method: "POST",
        body: form
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      ok: true,
      data: {
        filename: "Video-Teste.mp4",
        publicUrl: expect.stringContaining("http://localhost:3000/uploads/"),
        externallyReachable: false
      }
    });
    expect(existsSync(path.join(process.cwd(), "public", payload.data.publicPath))).toBe(true);
  });

  it("rejects unsupported files", async () => {
    const form = new FormData();

    form.set("file", new File(["hello"], "notes.txt", { type: "text/plain" }));

    const response = await POST(
      new Request("http://localhost:3000/api/media/upload", {
        method: "POST",
        body: form
      })
    );

    expect(response.status).toBe(415);
  });
});
