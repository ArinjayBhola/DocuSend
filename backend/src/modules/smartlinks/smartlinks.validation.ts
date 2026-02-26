import { z } from 'zod';

export const createSmartLinkSchema = z.object({
  documentId: z.number().int().positive(),
  recipientEmail: z.string().email(),
  recipientName: z.string().optional(),
  allowDownload: z.boolean().optional().default(false),
  requirePassword: z.boolean().optional().default(false),
  password: z.string().optional(),
  expiresAt: z.string().optional(),
  maxViews: z.number().int().positive().optional(),
});

export const updateSmartLinkSchema = z.object({
  recipientName: z.string().optional(),
  allowDownload: z.boolean().optional(),
  requirePassword: z.boolean().optional(),
  password: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  maxViews: z.number().int().positive().nullable().optional(),
});

export const listSmartLinksQuerySchema = z.object({
  documentId: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export type CreateSmartLinkBody = z.infer<typeof createSmartLinkSchema>;
export type UpdateSmartLinkBody = z.infer<typeof updateSmartLinkSchema>;
export type ListSmartLinksQuery = z.infer<typeof listSmartLinksQuerySchema>;
