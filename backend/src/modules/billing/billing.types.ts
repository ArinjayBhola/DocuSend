import { subscriptions } from '../../db/schema.js';

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

export type PlanType = 'free' | 'pro' | 'business';

export interface PlanLimits {
  documents: number;
  viewsPerMonth: number;
  workspaces: number;
  teamSeats: number;
  deals: number;
  sessions: number;
}

export interface RazorpayCustomerResponse {
  id: string;
}

export interface RazorpaySubscriptionResponse {
  id: string;
  status: string;
  current_start: number;
  current_end: number;
  plan_id: string;
  customer_id: string;
}

export * from './billing.validation.js';
