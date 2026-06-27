import { Queue, type ConnectionOptions } from "bullmq";

export const redisConnection: ConnectionOptions = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT || 6379)
};

let renderQueue: Queue | null = null;

export function getRenderQueue() {
  renderQueue ||= new Queue("render", { connection: redisConnection });
  return renderQueue;
}
