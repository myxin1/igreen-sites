import { Queue, Worker } from "bullmq";
import { ZernioService } from "@/lib/zernio.service";

export const publicationQueueName = "fastpost-publication";

const connection = {
  url: process.env.REDIS_URL ?? "redis://localhost:6379"
};

export function createPublicationQueue() {
  return new Queue(publicationQueueName, { connection });
}

export function createPublicationWorker() {
  const zernio = new ZernioService();

  return new Worker(
    publicationQueueName,
    async (job) => {
      const post = job.data as {
        id: string;
        caption: string;
        mediaUrl: string;
        storageKey?: string;
        profileId?: string;
        profileName?: string;
        filename?: string;
        scheduledAt: string;
        destinations: ("instagram" | "facebook" | "tiktok")[];
      };

      const response = await zernio.createPost({
        caption: post.caption,
        mediaUrl: post.mediaUrl,
        scheduledAt: post.scheduledAt,
        destinations: post.destinations,
        metadata: buildZernioMetadata({
          storageKey: post.storageKey,
          fastpostPostId: post.id,
          profileId: post.profileId,
          profileName: post.profileName,
          filename: post.filename
        })
      });

      return {
        postId: post.id,
        zernio: response
      };
    },
    { connection, concurrency: 5 }
  );
}

function buildZernioMetadata(input: Record<string, string | undefined>) {
  return Object.fromEntries(Object.entries(input).filter((entry): entry is [string, string] => Boolean(entry[1])));
}
