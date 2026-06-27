import { describe, expect, it } from "vitest";
import { buildScheduleSummary } from "./schedule-summary";

describe("buildScheduleSummary", () => {
  it("labels missing destinations and keeps selected profile/media details", () => {
    expect(
      buildScheduleSummary({
        profileName: "@receitas_fitness_e_lowcarb",
        destinations: [],
        postType: "reels",
        mediaCount: 0,
        selectedDate: "2026-06-04"
      })
    ).toEqual({
      profile: "@receitas_fitness_e_lowcarb",
      destinationsLabel: "Nenhum destino selecionado",
      selectedCountLabel: "0 selecionadas",
      postTypeLabel: "Reels",
      mediaLabel: "-",
      selectedDate: "2026-06-04"
    });
  });

  it("describes one reels upload as one video", () => {
    expect(
      buildScheduleSummary({
        profileName: "@receitas",
        destinations: ["instagram"],
        postType: "reels",
        mediaCount: 1,
        selectedDate: "2026-06-04"
      }).mediaLabel
    ).toBe("1 video");
  });
});
