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
        scheduledAt: string;
        destinations: ("instagram" | "facebook" | "tiktok")[];
      };

      const response = await zernio.createPost({
        caption: post.caption,
        mediaUrl: post.mediaUrl,
        scheduledAt: post.scheduledAt,
        destinations: post.destinations
      });

      return {
        postId: post.id,
        zernio: response
      };
    },
    { connection, concurrency: 5 }
  );
}
