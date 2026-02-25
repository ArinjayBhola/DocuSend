import { Document } from '../documents/index.js';
import { PlanLimits } from '../billing/index.js';

export interface DashboardDoc extends Document {
  viewCount: number;
  totalDuration: number;
  lastViewedAt?: string;
}

export interface DashboardSummary {
  docs: DashboardDoc[];
  docCount: number;
  limits: PlanLimits;
}
