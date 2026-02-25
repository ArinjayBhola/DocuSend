import { z } from 'zod';

export const createDealSchema = z.object({
  workspaceId: z.number(),
  accountName: z.string().min(1, 'Account name is required'),
  stage: z.enum(['prospecting', 'discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).optional(),
  value: z.number().optional(),
  currency: z.string().optional(),
  closeDate: z.string().nullable().optional(),
});

export const updateDealSchema = z.object({
  accountName: z.string().optional(),
  stage: z.enum(['prospecting', 'discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).optional(),
  value: z.number().optional(),
  currency: z.string().optional(),
  closeDate: z.string().nullable().optional(),
});

export const stakeholderSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  role: z.enum(['champion', 'decision_maker', 'influencer', 'technical', 'legal', 'finance']).optional(),
});

export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
export type StakeholderInput = z.infer<typeof stakeholderSchema>;
