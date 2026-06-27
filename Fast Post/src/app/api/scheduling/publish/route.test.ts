import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const originalApiKey = process.env.ZERNIO_API_KEY;

afterEach(() => {
  process.env.ZERNIO_API_KEY = originalApiKey;
  vi.restoreAllMocks();
});

describe("POST /api/scheduling/publish", () => {
  it("rejects posts without public media URLs", async () => {
    const response = await POST(
      new Request("http://localhost/api/scheduling/publish", {
        method: "POST",
        body: JSON.stringify({
          profileId: "profile-one",
          profileName: "Perfil",
          posts: [
            {
              id: "post-one",
              filename: "video.mp4",
              caption: "",
              mediaUrl: "",
              scheduledAt: "2026-06-06T15:00:00.000Z",
              destinations: ["instagram"]
            }
          ]
        })
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "Dados de publicacao invalidos. Informe uma URL publica para cada midia."
    });
  });

  it("creates real Zernio posts when API key and media URL are present", async () => {
    process.env.ZERNIO_API_KEY = "sk_test";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ post: { _id: "zernio-one", url: "https://social.example/post" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );

    const response = await POST(
      new Request("http://localhost/api/scheduling/publish", {
        method: "POST",
        body: JSON.stringify({
          profileId: "profile-one",
          profileName: "Perfil",
          posts: [
            {
              id: "post-one",
              filename: "video.mp4",
              caption: "Legenda",
              mediaUrl: "https://cdn.example/video.mp4",
              scheduledAt: "2026-06-06T15:00:00.000Z",
              destinations: ["instagram", "facebook"]
            }
          ]
        })
      })
    );

    expect(response.status).toBe(200);
    const [, init] = fetchMock.mock.calls[0] ?? [];

    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://zernio.com/api/v1/posts");
    expect(init).toMatchObject({
      method: "POST",
      body: JSON.stringify({
        caption: "Legenda",
        mediaUrl: "https://cdn.example/video.mp4",
        scheduledAt: "2026-06-06T15:00:00.000Z",
        destinations: ["instagram", "facebook"]
      })
    });
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: expect.stringMatching(/^Bearer\s+\S+/),
      "Content-Type": "application/json"
    });
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: {
        results: [
          {
            id: "post-one",
            filename: "video.mp4",
            status: "published",
            zernioPostId: "zernio-one",
            publishedUrl: "https://social.example/post"
          }
        ]
      }
    });
  });
});
