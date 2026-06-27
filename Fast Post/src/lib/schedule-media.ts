export type ScheduleMediaItem = {
  id: string;
  filename: string;
};

export function buildScheduleMediaItems(selectedFileNames: string[], simulatedCount: number): ScheduleMediaItem[] {
  if (selectedFileNames.length) {
    return selectedFileNames.map((filename, index) => ({
      id: `selected-${index + 1}`,
      filename
    }));
  }

  return Array.from({ length: simulatedCount }, (_, index) => ({
    id: `upload-${index + 1}`,
    filename: index % 4 === 0 ? `imagem-${index + 1}.webp` : `video-${index + 1}.mp4`
  }));
}
