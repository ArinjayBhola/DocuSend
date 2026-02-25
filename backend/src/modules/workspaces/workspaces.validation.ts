import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required').transform((val) => val.trim()),
  description: z.string().optional().transform((val) => val?.trim() || null),
});

export const addDocumentSchema = z.object({
  documentId: z.number().or(z.string().transform(val => parseInt(val))),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type AddDocumentInput = z.infer<typeof addDocumentSchema>;
