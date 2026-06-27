export type SocialProvider = "instagram" | "facebook" | "tiktok";

export type MediaInput = {
  id: string;
  filename: string;
};

export type ScheduleSlotInput = {
  hour: number;
  minute: number;
  active: boolean;
};

export type ExistingPostInput = {
  scheduledAt: string;
};

export type SchedulingPreviewInput = {
  profileId: string;
  media: MediaInput[];
  destinations: SocialProvider[];
  startDate: string;
  activeWeekdays: number[];
  slots: ScheduleSlotInput[];
  existingPosts: ExistingPostInput[];
  captionMode: "single" | "csv";
  defaultCaption?: string;
  captionsByFilename?: Record<string, string>;
  continueAfterExistingQueue?: boolean;
};

export type ScheduledPostPreview = {
  profileId: string;
  mediaId: string;
  filename: string;
  caption: string;
  destinations: SocialProvider[];
  scheduledAt: string;
};

export type SchedulingPreview = {
  posts: ScheduledPostPreview[];
  totalPosts: number;
  postsPerDay: number;
  durationDays: number;
  startDate: string | null;
  endDate: string | null;
  contentLastsDays: number;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export class SchedulingEngine {
  preview(input: SchedulingPreviewInput): SchedulingPreview {
    const slots = input.slots
      .filter((slot) => slot.active)
      .sort((left, right) => left.hour - right.hour || left.minute - right.minute);

    if (slots.length === 0) {
      throw new Error("At least one active schedule slot is required");
    }

    if (input.destinations.length === 0) {
      throw new Error("At least one destination is required");
    }

    if (input.activeWeekdays.length === 0) {
      throw new Error("At least one active weekday is required");
    }

    const occupied = new Set(input.existingPosts.map((post) => post.scheduledAt));
    const posts: ScheduledPostPreview[] = [];
    let cursorDate = input.continueAfterExistingQueue
      ? this.dayAfterLatestPost(input.startDate, input.existingPosts)
      : parseDateOnly(input.startDate);

    let slotIndex = 0;

    for (const media of input.media) {
      const next = this.getNextAvailableSlot({
        cursorDate,
        slotIndex,
        slots,
        activeWeekdays: new Set(input.activeWeekdays),
        occupied
      });

      const scheduledAt = next.scheduledAt.toISOString();
      occupied.add(scheduledAt);
      cursorDate = next.cursorDate;
      slotIndex = next.slotIndex;

      posts.push({
        profileId: input.profileId,
        mediaId: media.id,
        filename: media.filename,
        caption: this.captionFor(input, media.filename),
        destinations: input.destinations,
        scheduledAt
      });
    }

    const startDate = posts[0]?.scheduledAt.slice(0, 10) ?? null;
    const endDate = posts.at(-1)?.scheduledAt.slice(0, 10) ?? null;
    const durationDays =
      startDate && endDate
        ? Math.floor((parseDateOnly(endDate).getTime() - parseDateOnly(startDate).getTime()) / DAY_IN_MS) + 1
        : 0;

    return {
      posts,
      totalPosts: posts.length,
      postsPerDay: slots.length,
      durationDays,
      startDate,
      endDate,
      contentLastsDays: Math.ceil(posts.length / slots.length)
    };
  }

  private getNextAvailableSlot(params: {
    cursorDate: Date;
    slotIndex: number;
    slots: ScheduleSlotInput[];
    activeWeekdays: Set<number>;
    occupied: Set<string>;
  }): { scheduledAt: Date; cursorDate: Date; slotIndex: number } {
    let date = new Date(params.cursorDate);
    let slotIndex = params.slotIndex;

    for (let guard = 0; guard < 100000; guard += 1) {
      if (!params.activeWeekdays.has(date.getUTCDay())) {
        date = addDays(date, 1);
        slotIndex = 0;
        continue;
      }

      const slot = params.slots[slotIndex];
      const scheduledAt = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), slot.hour, slot.minute));
      const iso = scheduledAt.toISOString();
      slotIndex += 1;

      if (slotIndex >= params.slots.length) {
        date = addDays(date, 1);
        slotIndex = 0;
      }

      if (!params.occupied.has(iso)) {
        return { scheduledAt, cursorDate: date, slotIndex };
      }
    }

    throw new Error("Could not find an available schedule slot");
  }

  private dayAfterLatestPost(startDate: string, existingPosts: ExistingPostInput[]): Date {
    if (existingPosts.length === 0) {
      return parseDateOnly(startDate);
    }

    const latest = existingPosts
      .map((post) => new Date(post.scheduledAt))
      .sort((left, right) => right.getTime() - left.getTime())[0];

    return addDays(parseDateOnly(latest.toISOString().slice(0, 10)), 1);
  }

  private captionFor(input: SchedulingPreviewInput, filename: string): string {
    if (input.captionMode === "csv") {
      return input.captionsByFilename?.[filename] ?? input.defaultCaption ?? "";
    }

    return input.defaultCaption ?? "";
  }
}

function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_IN_MS);
}
