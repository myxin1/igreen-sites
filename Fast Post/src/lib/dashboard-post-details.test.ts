import { describe, expect, it } from "vitest";
import { buildPostDetails } from "./dashboard-post-details";

describe("buildPostDetails", () => {
  it("formats the post detail drawer fields shown from a recent post", () => {
    const details = buildPostDetails({
      id: "551",
      profile: "@Receitas Low Carb e Fitness",
      filename: "27.mp4",
      scheduledAt: "2026-06-27T12:00:00.000Z",
      status: "scheduled",
      type: "reels",
      batchId: "MD-uLF59c",
      caption: "Nao esqueca de participar do nosso grupo. #receitas #lowcarb"
    });

    expect(details).toEqual({
      account: "@Receitas Low Carb e Fitness",
      filename: "27.mp4",
      typeLabel: "REELS",
      scheduledFor: "27/06/2026, 12:00:00",
      statusLabel: "Agendado",
      statusTone: "warning",
      batchId: "MD-uLF59c",
      caption: "Nao esqueca de participar do nosso grupo. #receitas #lowcarb"
    });
  });
});
