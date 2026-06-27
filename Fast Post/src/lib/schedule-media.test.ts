import { describe, expect, it } from "vitest";
import { buildScheduleMediaItems } from "./schedule-media";

describe("buildScheduleMediaItems", () => {
  it("uses selected file names when the user chooses files", () => {
    expect(buildScheduleMediaItems(["receita.mp4", "foto.webp"], 8)).toEqual([
      { id: "selected-1", filename: "receita.mp4" },
      { id: "selected-2", filename: "foto.webp" }
    ]);
  });

  it("falls back to simulated media when no files were selected", () => {
    expect(buildScheduleMediaItems([], 2)).toEqual([
      { id: "upload-1", filename: "imagem-1.webp" },
      { id: "upload-2", filename: "video-2.mp4" }
    ]);
  });
});
