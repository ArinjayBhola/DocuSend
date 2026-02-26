export type LeadClassification = "hot" | "warm" | "interested" | "cold";

export type FollowUpPriority = "high" | "medium" | "low";

export interface EngagementScore {
  viewerEmail: string;
  documentId: number;
  documentTitle: string;
  score: number;
  classification: LeadClassification;
  timeScore: number;
  completionScore: number;
  frequencyScore: number;
  recencyScore: number;
  depthScore: number;
  totalTimeSpent: number;
  pagesViewed: number;
  totalPages: number;
  visitCount: number;
  lastViewedAt: string;
}

export interface FollowUpSuggestion {
  viewerEmail: string;
  documentId: number;
  documentTitle: string;
  priority: FollowUpPriority;
  action: string;
  reason: string;
  suggestedTiming: string;
  score: number;
  classification: LeadClassification;
}

export interface DocumentPerformance {
  documentId: number;
  title: string;
  avgEngagementScore: number;
  totalViewers: number;
  completionRate: number;
  avgTimeSpent: number;
  hotLeads: number;
  warmLeads: number;
  interestedLeads: number;
  coldLeads: number;
  createdAt: string;
}

export interface ViewerRawData {
  viewerEmail: string;
  documentId: number;
  documentTitle: string;
  totalDuration: number;
  totalPagesViewed: number;
  totalPages: number;
  visitCount: number;
  lastViewedAt: string;
  avgTimePerPage: number;
}
