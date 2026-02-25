import { z } from 'zod';
export const subscribeSchema = z.object({
    plan: z.enum(['pro', 'business']),
});
export const successSchema = z.object({
    razorpay_subscription_id: z.string(),
    plan: z.enum(['pro', 'business']).optional(),
});
