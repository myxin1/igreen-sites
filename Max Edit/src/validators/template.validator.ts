import { z } from "zod";

export const createTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  outputWidth: z.number().optional(),
  outputHeight: z.number().optional(),
  durationMode: z.enum(["template", "source"]).optional()
});
