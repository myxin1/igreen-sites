import { describe, expect, it } from "vitest";
import {
  buildDashboardPostsFromLocalQueue,
  markLocalQueueJobForReprocessing,
  mergeDashboardPosts,
  removeLocalQueueJobs
} from "./local-post-queue";
import type { DashboardRecentPost } from "./dashboard-post-details";

describe("local post queue", () => {
  it("converts locally confirmed publish jobs into dashboard recent posts", () => {
    expect(
      buildDashboardPostsFromLocalQueue([
        {
          id: "queued-1",
          profileName: "Receitas Low Carb",
          filename: "video-final.mp4",
          caption: "Legenda final",
          scheduledAt: "2026-06-06T15:00:00.000Z",
          status: "published"
        }
      ])
    ).toEqual([
      {
        id: "queued-1",
        profile: "Receitas Low Carb",
        filename: "video-final.mp4",
        scheduledAt: "2026-06-06T15:00:00.000Z",
        status: "published",
        type: "reels",
        batchId: "queued-1",
        caption: "Legenda final"
      }
    ]);
  });

  it("shows local posts before demo posts and avoids duplicate ids", () => {
    const demoPost: DashboardRecentPost = {
      id: "queued-1",
      profile: "@demo",
      filename: "demo.mp4",
      scheduledAt: "2026-06-05T12:00:00.000Z",
      status: "scheduled",
      type: "reels",
      batchId: "demo-batch",
      caption: ""
    };

    const localPost: DashboardRecentPost = {
      ...demoPost,
      profile: "Receitas Low Carb",
      filename: "novo.mp4",
      status: "published"
    };

    expect(mergeDashboardPosts([demoPost], [localPost])).toEqual([localPost]);
  });

  it("marks a failed local job for reprocessing", () => {
    expect(
      markLocalQueueJobForReprocessing(
        [
          {
            id: "failed-one",
            filename: "video.mp4",
            scheduledAt: "2026-06-06T15:00:00.000Z",
            status: "failed",
            errorMessage: "Zernio failed"
          }
        ],
        "failed-one"
      )
    ).toEqual([
      {
        id: "failed-one",
        filename: "video.mp4",
        scheduledAt: "2026-06-06T15:00:00.000Z",
        status: "processing",
        errorMessage: ""
      }
    ]);
  });

  it("removes selected local queue jobs", () => {
    expect(
      removeLocalQueueJobs(
        [
          { id: "one", filename: "one.mp4", scheduledAt: "2026-06-06T15:00:00.000Z" },
          { id: "two", filename: "two.mp4", scheduledAt: "2026-06-06T16:00:00.000Z" }
        ],
        ["two"]
      )
    ).toEqual([{ id: "one", filename: "one.mp4", scheduledAt: "2026-06-06T15:00:00.000Z" }]);
  });
});
