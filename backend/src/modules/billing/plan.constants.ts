import { PlanLimits, PlanType } from './billing.types.js';

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: { documents: 5, viewsPerMonth: 100, workspaces: 0, teamSeats: 1, deals: 0, sessions: 0, engagementViewers: 0 },
  pro: { documents: 50, viewsPerMonth: Infinity, workspaces: 5, teamSeats: 1, deals: 5, sessions: 10, engagementViewers: 50 },
  business: {
    documents: Infinity,
    viewsPerMonth: Infinity,
    workspaces: Infinity,
    teamSeats: 10,
    deals: Infinity,
    sessions: Infinity,
    engagementViewers: Infinity,
  },
};

export function getPlanLimits(plan: string): PlanLimits {
  const p = plan as PlanType;
  return PLAN_LIMITS[p] || PLAN_LIMITS.free;
}
