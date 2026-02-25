import { DashboardRepository } from './dashboard.repository.js';
import { getPlanLimits } from '../billing/index.js';
export class DashboardService {
    repository;
    constructor() {
        this.repository = new DashboardRepository();
    }
    async getDashboardSummary(userId, plan) {
        const docs = await this.repository.getDocsWithStats(userId);
        const limits = getPlanLimits(plan);
        return {
            docs,
            docCount: docs.length,
            limits,
        };
    }
}
