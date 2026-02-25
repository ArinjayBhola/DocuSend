import { z } from 'zod';
export const updateDocumentSchema = z.object({
    title: z.string().optional(),
    password: z.string().nullable().optional(),
    requireEmail: z.boolean().optional(),
    allowDownload: z.boolean().optional(),
    expiresAt: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
});
export const uploadDocumentSchema = z.object({
    title: z.string().optional(),
});
