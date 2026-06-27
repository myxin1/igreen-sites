import type { SocialProvider } from "./scheduling-engine";

export type SchedulePostType = "reels" | "feed" | "carousel";

const postTypeLabels: Record<SchedulePostType, string> = {
  reels: "Reels",
  feed: "Feed",
  carousel: "Carrossel"
};

const destinationLabels: Record<SocialProvider, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok"
};

export function buildScheduleSummary(input: {
  profileName: string;
  destinations: SocialProvider[];
  postType: SchedulePostType;
  mediaCount: number;
  selectedDate: string;
}) {
  return {
    profile: input.profileName,
    destinationsLabel: input.destinations.length
      ? input.destinations.map((destination) => destinationLabels[destination]).join(", ")
      : "Nenhum destino selecionado",
    selectedCountLabel: `${input.destinations.length} selecionadas`,
    postTypeLabel: postTypeLabels[input.postType],
    mediaLabel: formatMediaLabel(input.mediaCount, input.postType),
    selectedDate: input.selectedDate
  };
}

function formatMediaLabel(count: number, postType: SchedulePostType) {
  if (!count) {
    return "-";
  }

  const singular = postType === "reels" ? "video" : "midia";
  const plural = postType === "reels" ? "videos" : "midias";

  return `${count} ${count === 1 ? singular : plural}`;
}
