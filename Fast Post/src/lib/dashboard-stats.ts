import type { ProfileSummary } from "./demo-data";
import type { DashboardRecentPost } from "./dashboard-post-details";
import type { SocialProvider } from "./scheduling-engine";

export type DashboardStats = {
  connectedAccounts: number;
  scheduledPosts: number;
  publishedPosts: number;
  processingPosts: number;
  failedPosts: number;
  totalPosts: number;
  successRate: number;
};

export type DashboardAlert = {
  id: string;
  profileName: string;
  provider: SocialProvider;
  username: string;
  tone: "warning" | "danger";
  title: string;
  message: string;
};

const providerLabels: Record<SocialProvider, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok"
};

export function buildDashboardStats(input: {
  profiles: ProfileSummary[];
  posts: DashboardRecentPost[];
}): DashboardStats {
  const connectedAccounts = input.profiles.reduce((total, profile) => total + profile.accounts.length, 0);
  const scheduledPosts = input.posts.filter((post) => post.status === "scheduled").length;
  const publishedPosts = input.posts.filter((post) => post.status === "published").length;
  const processingPosts = input.posts.filter((post) => post.status === "processing").length;
  const failedPosts = input.posts.filter((post) => post.status === "failed").length;
  const totalPosts = input.posts.length;

  return {
    connectedAccounts,
    scheduledPosts,
    publishedPosts,
    processingPosts,
    failedPosts,
    totalPosts,
    successRate: Math.round((publishedPosts / Math.max(totalPosts, 1)) * 100)
  };
}

export function buildDashboardAlerts(profiles: ProfileSummary[]): DashboardAlert[] {
  return profiles.flatMap((profile) =>
    profile.accounts
      .filter((account) => account.status !== "active")
      .map((account) => {
        const provider = providerLabels[account.provider];
        const disconnected = account.status === "expired";

        return {
          id: `${profile.id}-${account.provider}-${account.status}`,
          profileName: profile.name,
          provider: account.provider,
          username: account.username,
          tone: disconnected ? "warning" : "danger",
          title: disconnected ? `${provider} desconectou` : `${provider} com erro`,
          message: disconnected
            ? `${profile.name} precisa reconectar ${account.username}.`
            : `${profile.name} precisa revisar ${account.username}.`
        };
      })
  );
}

export function buildDashboardRecentPosts(input: {
  profiles: ProfileSummary[];
  posts: DashboardRecentPost[];
}): DashboardRecentPost[] {
  if (input.profiles.length === 0) {
    return [];
  }

  const knownProfiles = input.profiles.flatMap((profile) => [
    profile.name,
    ...profile.accounts.map((account) => account.username)
  ]);

  return input.posts.filter((post) => knownProfiles.some((profile) => sameProfile(profile, post.profile)));
}

function sameProfile(profile: string, postProfile: string) {
  const normalizedProfile = normalizeProfile(profile);
  const normalizedPostProfile = normalizeProfile(postProfile);

  return (
    normalizedProfile.length > 0 &&
    normalizedPostProfile.length > 0 &&
    (normalizedProfile === normalizedPostProfile ||
      normalizedProfile.includes(normalizedPostProfile) ||
      normalizedPostProfile.includes(normalizedProfile))
  );
}

function normalizeProfile(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}
