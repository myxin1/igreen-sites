import { z } from "zod";

export const schedulingRequestSchema = z.object({
  profileId: z.string().min(1),
  media: z.array(z.object({ id: z.string().min(1), filename: z.string().min(1) })).min(1),
  destinations: z.array(z.enum(["instagram", "facebook", "tiktok"])).min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  activeWeekdays: z.array(z.number().int().min(0).max(6)).min(1),
  slots: z.array(z.object({ hour: z.number().int().min(0).max(23), minute: z.number().int().min(0).max(59), active: z.boolean() })).min(1),
  existingPosts: z.array(z.object({ scheduledAt: z.string().datetime() })).default([]),
  captionMode: z.enum(["single", "csv"]),
  defaultCaption: z.string().optional(),
  captionsByFilename: z.record(z.string()).optional(),
  continueAfterExistingQueue: z.boolean().optional()
});

export const publishPostSchema = z.object({
  profileId: z.string().min(1),
  profileName: z.string().min(1),
  posts: z.array(
    z.object({
      id: z.string().min(1),
      filename: z.string().min(1),
      caption: z.string(),
      mediaUrl: z.string().url(),
      storageKey: z.string().optional(),
      scheduledAt: z.string().datetime(),
      destinations: z.array(z.enum(["instagram", "facebook", "tiktok"])).min(1)
    })
  ).min(1)
});

export const zernioWebhookSchema = z.object({
  event: z.string().min(1),
  externalId: z.string().optional(),
  postId: z.string().optional(),
  status: z.string().optional(),
  publishedUrl: z.string().url().optional(),
  errorMessage: z.string().optional(),
  data: z.record(z.unknown()).optional()
});
