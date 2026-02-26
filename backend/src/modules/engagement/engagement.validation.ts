import { z } from "zod";

export const scoresQuerySchema = z.object({
  classification: z.enum(["hot", "warm", "interested", "cold"]).optional(),
  sortBy: z.enum(["score", "recency", "time"]).optional().default("score"),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export const documentScoresParamsSchema = z.object({
  documentId: z.coerce.number().int().positive(),
});

export const followUpsQuerySchema = z.object({
  priority: z.enum(["high", "medium", "low"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const documentPerformanceQuerySchema = z.object({
  sortBy: z.enum(["avgScore", "viewers", "completionRate"]).optional().default("avgScore"),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type ScoresQuery = z.infer<typeof scoresQuerySchema>;
export type DocumentScoresParams = z.infer<typeof documentScoresParamsSchema>;
export type FollowUpsQuery = z.infer<typeof followUpsQuerySchema>;
export type DocumentPerformanceQuery = z.infer<typeof documentPerformanceQuerySchema>;
