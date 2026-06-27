import { describe, expect, it } from "vitest";
import {
  SchedulingEngine,
  type SchedulingPreviewInput
} from "@/lib/scheduling-engine";

const baseInput: SchedulingPreviewInput = {
  profileId: "profile-low-carb",
  media: Array.from({ length: 7 }, (_, index) => ({
    id: `media-${index + 1}`,
    filename: `video-${index + 1}.mp4`
  })),
  destinations: ["instagram", "facebook"],
  startDate: "2026-06-03",
  activeWeekdays: [1, 2, 3, 4, 5, 6, 0],
  slots: [
    { hour: 9, minute: 0, active: true },
    { hour: 15, minute: 0, active: true },
    { hour: 20, minute: 0, active: true }
  ],
  existingPosts: [],
  captionMode: "single",
  defaultCaption: "Receita nova no ar."
};

describe("SchedulingEngine", () => {
  it("distributes bulk media across the next active slots in order", () => {
    const preview = new SchedulingEngine().preview(baseInput);

    expect(preview.posts.map((post) => post.scheduledAt)).toEqual([
      "2026-06-03T09:00:00.000Z",
      "2026-06-03T15:00:00.000Z",
      "2026-06-03T20:00:00.000Z",
      "2026-06-04T09:00:00.000Z",
      "2026-06-04T15:00:00.000Z",
      "2026-06-04T20:00:00.000Z",
      "2026-06-05T09:00:00.000Z"
    ]);
    expect(preview.totalPosts).toBe(7);
    expect(preview.postsPerDay).toBe(3);
    expect(preview.durationDays).toBe(3);
    expect(preview.endDate).toBe("2026-06-05");
  });

  it("skips inactive weekdays and occupied slots without overwriting existing posts", () => {
    const preview = new SchedulingEngine().preview({
      ...baseInput,
      media: baseInput.media.slice(0, 4),
      activeWeekdays: [1, 3],
      existingPosts: [{ scheduledAt: "2026-06-03T09:00:00.000Z" }]
    });

    expect(preview.posts.map((post) => post.scheduledAt)).toEqual([
      "2026-06-03T15:00:00.000Z",
      "2026-06-03T20:00:00.000Z",
      "2026-06-08T09:00:00.000Z",
      "2026-06-08T15:00:00.000Z"
    ]);
  });

  it("maps CSV captions by filename and falls back to the default caption", () => {
    const preview = new SchedulingEngine().preview({
      ...baseInput,
      media: baseInput.media.slice(0, 3),
      captionMode: "csv",
      captionsByFilename: {
        "video-1.mp4": "Legenda 1",
        "video-3.mp4": "Legenda 3"
      },
      defaultCaption: "Legenda padrao"
    });

    expect(preview.posts.map((post) => post.caption)).toEqual([
      "Legenda 1",
      "Legenda padrao",
      "Legenda 3"
    ]);
  });

  it("continues refills after the latest occupied slot when requested", () => {
    const preview = new SchedulingEngine().preview({
      ...baseInput,
      media: baseInput.media.slice(0, 2),
      continueAfterExistingQueue: true,
      existingPosts: [
        { scheduledAt: "2026-06-03T09:00:00.000Z" },
        { scheduledAt: "2026-06-09T20:00:00.000Z" }
      ]
    });

    expect(preview.posts.map((post) => post.scheduledAt)).toEqual([
      "2026-06-10T09:00:00.000Z",
      "2026-06-10T15:00:00.000Z"
    ]);
  });

  it("throws a clear error when there are no active slots or destinations", () => {
    const engine = new SchedulingEngine();

    expect(() => engine.preview({ ...baseInput, slots: [] })).toThrow(
      "At least one active schedule slot is required"
    );
    expect(() => engine.preview({ ...baseInput, destinations: [] })).toThrow(
      "At least one destination is required"
    );
  });
});
