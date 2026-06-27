import type { SocialProvider } from "@/lib/scheduling-engine";

type ZernioPostPayload = {
  caption: string;
  mediaUrl: string;
  scheduledAt: string;
  destinations: SocialProvider[];
};

export class ZernioService {
  private readonly baseUrl = "https://zernio.com/api/v1";

  constructor(private readonly apiKey = process.env.ZERNIO_API_KEY) {}

  async createProfile(input: { name: string; description?: string }) {
    return this.request<{ profile: { _id: string; name: string } }>("/profiles", {
      method: "POST",
      body: input
    });
  }

  async getConnectUrl(input: { platform: SocialProvider; profileId: string }) {
    return this.request<{ authUrl?: string; auth_url?: string }>(
      `/connect/${input.platform}?profileId=${encodeURIComponent(input.profileId)}`,
      { method: "GET" }
    );
  }

  async connectAccount(provider: SocialProvider, profileId: string) {
    return this.getConnectUrl({ platform: provider, profileId });
  }

  async syncAccounts() {
    return this.listAccounts();
  }

  async listAccounts() {
    return this.request<{ accounts: Array<Record<string, unknown>> }>("/accounts", { method: "GET" });
  }

  async createPost(payload: ZernioPostPayload) {
    return this.request("/posts", { method: "POST", body: payload });
  }

  async deletePost(externalPostId: string) {
    return this.request(`/posts/${externalPostId}`, { method: "DELETE" });
  }

  async getPost(externalPostId: string) {
    return this.request(`/posts/${externalPostId}`, { method: "GET" });
  }

  async getAnalytics(externalPostId: string) {
    return this.request(`/posts/${externalPostId}/analytics`, { method: "GET" });
  }

  async uploadMedia(fileUrl: string) {
    return this.request("/media", { method: "POST", body: { fileUrl } });
  }

  private async request<T>(path: string, init: { method: string; body?: unknown }): Promise<T> {
    if (!this.apiKey) {
      throw new Error("ZERNIO_API_KEY is not configured");
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: init.method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: init.body ? JSON.stringify(init.body) : undefined
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Zernio request failed: ${response.status} ${body}`);
    }

    return response.json();
  }
}
