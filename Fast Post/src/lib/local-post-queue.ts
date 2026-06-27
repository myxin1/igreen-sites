import type { DashboardPostStatus, DashboardRecentPost } from "./dashboard-post-details";

export const localQueueStorageKey = "fastpost_queue_jobs";

type LocalQueueStatus = DashboardPostStatus | "ready" | "queue";

export type LocalQueueJob = {
  id?: unknown;
  profileId?: unknown;
  profileName?: unknown;
  profile?: unknown;
  mediaId?: unknown;
  filename?: unknown;
  caption?: unknown;
  mediaUrl?: unknown;
  storageKey?: unknown;
  destinations?: unknown;
  scheduledAt?: unknown;
  status?: unknown;
  zernioPostId?: unknown;
  publishedUrl?: unknown;
  errorMessage?: unknown;
};

export function parseLocalQueueJobs(value: string | null): LocalQueueJob[] {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);

    return Array.isArray(parsed) ? parsed.filter((item): item is LocalQueueJob => item !== null && typeof item === "object") : [];
  } catch {
    return [];
  }
}

export function buildDashboardPostsFromLocalQueue(jobs: LocalQueueJob[]): DashboardRecentPost[] {
  return jobs
    .map((job, index) => {
      const id = asText(job.id) || `local-${index + 1}`;
      const filename = asText(job.filename);
      const scheduledAt = asText(job.scheduledAt);

      if (!filename || !scheduledAt) {
        return null;
      }

      const publishedUrl = asText(job.publishedUrl);

      return {
        id,
        profile: asText(job.profileName) || asText(job.profile) || "FastPost",
        filename,
        scheduledAt,
        status: normalizeStatus(job.status),
        type: mediaTypeFor(filename),
        batchId: id,
        caption: [asText(job.caption), asText(job.errorMessage)].filter(Boolean).join("\n\nErro: "),
        ...(publishedUrl ? { publishedUrl } : {})
      };
    })
    .filter((post): post is DashboardRecentPost => post !== null)
    .sort((left, right) => new Date(right.scheduledAt).getTime() - new Date(left.scheduledAt).getTime());
}

export function mergeDashboardPosts(demoPosts: DashboardRecentPost[], localPosts: DashboardRecentPost[]) {
  const localIds = new Set(localPosts.map((post) => post.id));

  return [...localPosts, ...demoPosts.filter((post) => !localIds.has(post.id))];
}

export function markLocalQueueJobForReprocessing(jobs: LocalQueueJob[], postId: string): LocalQueueJob[] {
  return jobs.map((job) =>
    asText(job.id) === postId
      ? {
          ...job,
          status: "processing",
          errorMessage: ""
        }
      : job
  );
}

export function removeLocalQueueJobs(jobs: LocalQueueJob[], postIds: string[]): LocalQueueJob[] {
  const selected = new Set(postIds);

  return jobs.filter((job) => !selected.has(asText(job.id)));
}

function asText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizeStatus(value: unknown): DashboardPostStatus {
  const status = asText(value).toLowerCase() as LocalQueueStatus;

  if (status === "published" || status === "scheduled" || status === "processing" || status === "failed") {
    return status;
  }

  if (status === "ready" || status === "queue") {
    return "processing";
  }

  return "scheduled";
}

function mediaTypeFor(filename: string): DashboardRecentPost["type"] {
  return filename.match(/\.(jpg|jpeg|png|webp)$/i) ? "feed" : "reels";
}
