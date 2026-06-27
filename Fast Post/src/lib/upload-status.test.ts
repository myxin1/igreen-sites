import { describe, expect, it } from "vitest";
import { buildUploadRows } from "./upload-status";

describe("buildUploadRows", () => {
  it("marks every uploaded file as sent by default", () => {
    expect(
      buildUploadRows(
        [
          { id: "selected-1", filename: "1.mp4" },
          { id: "selected-2", filename: "2.mp4" }
        ],
        []
      )
    ).toEqual([
      { id: "selected-1", filename: "1.mp4", progress: 100, statusLabel: "enviado", retrying: false },
      { id: "selected-2", filename: "2.mp4", progress: 100, statusLabel: "enviado", retrying: false }
    ]);
  });

  it("shows retrying progress for selected files", () => {
    expect(buildUploadRows([{ id: "selected-1", filename: "1.mp4" }], ["selected-1"])).toEqual([
      { id: "selected-1", filename: "1.mp4", progress: 55, statusLabel: "reenviando", retrying: true }
    ]);
  });
});
