import { DashboardRepository } from './dashboard.repository.js';
import { DashboardSummary } from './dashboard.types.js';
import { getPlanLimits } from '../billing/index.js';
import { PlanType } from '../billing/billing.types.js';

export class DashboardService {
  private repository: DashboardRepository;

  constructor() {
    this.repository = new DashboardRepository();
  }

  async getDashboardSummary(userId: number, plan: PlanType): Promise<DashboardSummary> {
    const docs = await this.repository.getDocsWithStats(userId);
    const limits = getPlanLimits(plan);

    return {
      docs,
      docCount: docs.length,
      limits,
    };
  }
}
