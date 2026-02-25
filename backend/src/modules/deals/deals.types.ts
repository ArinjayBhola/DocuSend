import { deals, stakeholders, dealActivities } from '../../db/schema.js';

export type Deal = typeof deals.$inferSelect;
export type NewDeal = typeof deals.$inferInsert;

export type Stakeholder = typeof stakeholders.$inferSelect;
export type NewStakeholder = typeof stakeholders.$inferInsert;

export type DealActivity = typeof dealActivities.$inferSelect;
export type NewDealActivity = typeof dealActivities.$inferInsert;

export type DealStage = 'prospecting' | 'discovery' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
export type HealthStatus = 'healthy' | 'at_risk' | 'critical';
export type StakeholderRole = 'champion' | 'decision_maker' | 'influencer' | 'technical' | 'legal' | 'finance';

export interface EngagementStats {
  totalDocuments: number;
  totalViews: number;
  totalDuration: number;
  daysInStage: number;
}

export interface RiskSignal {
  signal: string;
  severity: 'low' | 'medium' | 'high';
  penalty: number;
  description: string;
}

export interface RiskAssessment {
  riskScore: number;
  healthStatus: HealthStatus;
  signals: RiskSignal[];
  stakeholderScores: any[];
}

export * from './deals.validation.js';
