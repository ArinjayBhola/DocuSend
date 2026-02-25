import { z } from 'zod';

export const createSessionSchema = z.object({
  documentId: z.number(),
  title: z.string().min(1, 'Title is required'),
  maxParticipants: z.number().int().min(1).max(100).optional(),
});

export const joinSessionSchema = z.object({
  code: z.string().min(1, 'Invite code is required').transform(s => s.trim()),
});

export const presenceSchema = z.object({
  currentPage: z.number().optional(),
  cursorX: z.number().optional(),
  cursorY: z.number().optional(),
});

export const createAnnotationSchema = z.object({
  pageNumber: z.number(),
  type: z.string(),
  data: z.any(),
  color: z.string().optional(),
});

export const updateAnnotationSchema = z.object({
  data: z.any().optional(),
  resolved: z.boolean().optional(),
});

export const createMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').transform(s => s.trim()),
  annotationId: z.number().nullable().optional(),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type JoinSessionInput = z.infer<typeof joinSessionSchema>;
export type PresenceInput = z.infer<typeof presenceSchema>;
export type CreateAnnotationInput = z.infer<typeof createAnnotationSchema>;
export type UpdateAnnotationInput = z.infer<typeof updateAnnotationSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
