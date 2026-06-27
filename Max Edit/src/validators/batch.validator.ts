import { z } from "zod";

export const createBatchSchema = z.object({ name: z.string().min(1) });
