import { describe, expect, it } from "vitest";
import { buildDashboardAlerts, buildDashboardRecentPosts, buildDashboardStats } from "./dashboard-stats";
import type { DashboardRecentPost } from "./dashboard-post-details";
import type { ProfileSummary } from "./demo-data";

const profiles: ProfileSummary[] = [
  {
    id: "one",
    name: "Perfil OK",
    description: "",
    avatar: "OK",
    queueRemaining: 10,
    queueDays: 5,
    slots: [],
    accounts: [{ provider: "instagram", username: "@ok", status: "active" }]
  },
  {
    id: "two",
    name: "Perfil Problema",
    description: "",
    avatar: "PP",
    queueRemaining: 0,
    queueDays: 0,
    slots: [],
    accounts: [
      { provider: "facebook", username: "Pagina", status: "expired" },
      { provider: "tiktok", username: "@erro", status: "error" }
    ]
  }
];

describe("dashboard stats", () => {
  it("builds local dashboard stats from profiles and real recent posts", () => {
    expect(
      buildDashboardStats({
        profiles,
        posts: [
          recentPosts[0],
          { ...recentPosts[0], id: "published", status: "published" },
          { ...recentPosts[0], id: "processing", status: "processing" },
          { ...recentPosts[0], id: "failed", status: "failed" }
        ]
      })
    ).toEqual({
      connectedAccounts: 3,
      scheduledPosts: 1,
      publishedPosts: 1,
      processingPosts: 1,
      failedPosts: 1,
      totalPosts: 4,
      successRate: 25
    });
  });

  it("creates alerts for expired and errored profile accounts", () => {
    expect(buildDashboardAlerts(profiles)).toEqual([
      {
        id: "two-facebook-expired",
        profileName: "Perfil Problema",
        provider: "facebook",
        username: "Pagina",
        tone: "warning",
        title: "Facebook desconectou",
        message: "Perfil Problema precisa reconectar Pagina."
      },
      {
        id: "two-tiktok-error",
        profileName: "Perfil Problema",
        provider: "tiktok",
        username: "@erro",
        tone: "danger",
        title: "TikTok com erro",
        message: "Perfil Problema precisa revisar @erro."
      }
    ]);
  });

  it("hides recent posts when no profile exists", () => {
    expect(buildDashboardRecentPosts({ profiles: [], posts: recentPosts })).toEqual([]);
  });

  it("keeps only recent posts that belong to existing profiles", () => {
    expect(buildDashboardRecentPosts({ profiles: profiles.slice(0, 1), posts: recentPosts })).toEqual([recentPosts[0]]);
  });
});

const recentPosts: DashboardRecentPost[] = [
  {
    id: "one",
    profile: "@ok",
    filename: "video.mp4",
    scheduledAt: "2026-06-27T12:00:00.000Z",
    status: "scheduled",
    type: "reels",
    batchId: "batch-one",
    caption: ""
  },
  {
    id: "two",
    profile: "@missing",
    filename: "other.mp4",
    scheduledAt: "2026-06-27T13:00:00.000Z",
    status: "scheduled",
    type: "reels",
    batchId: "batch-two",
    caption: ""
  }
];
