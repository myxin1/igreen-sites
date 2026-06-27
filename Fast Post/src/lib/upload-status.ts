import type { ScheduleMediaItem } from "./schedule-media";

export type UploadRow = ScheduleMediaItem & {
  progress: number;
  statusLabel: "enviado" | "reenviando";
  retrying: boolean;
};

export function buildUploadRows(media: ScheduleMediaItem[], retryingIds: string[]): UploadRow[] {
  const retrying = new Set(retryingIds);

  return media.map((item) => {
    const isRetrying = retrying.has(item.id);

    return {
      ...item,
      progress: isRetrying ? 55 : 100,
      statusLabel: isRetrying ? "reenviando" : "enviado",
      retrying: isRetrying
    };
  });
}
