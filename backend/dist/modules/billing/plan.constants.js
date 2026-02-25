export const PLAN_LIMITS = {
    free: { documents: 5, viewsPerMonth: 100, workspaces: 0, teamSeats: 1, deals: 0, sessions: 0 },
    pro: { documents: 50, viewsPerMonth: Infinity, workspaces: 5, teamSeats: 1, deals: 5, sessions: 10 },
    business: {
        documents: Infinity,
        viewsPerMonth: Infinity,
        workspaces: Infinity,
        teamSeats: 10,
        deals: Infinity,
        sessions: Infinity,
    },
};
export function getPlanLimits(plan) {
    const p = plan;
    return PLAN_LIMITS[p] || PLAN_LIMITS.free;
}
