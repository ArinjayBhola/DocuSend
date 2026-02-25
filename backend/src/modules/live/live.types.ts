import { Response } from 'express';

export interface LiveSession {
  viewId: string;
  documentId: number;
  documentTitle: string;
  userId: number; // Doc owner
  viewerEmail: string | null;
  viewerIp: string;
  currentPage: number;
  totalPages: number;
  startedAt: number;
  lastActivity: number;
  pagesVisited: Set<number>;
  timeOnCurrentPage: number;
}

export interface ViewerEngagement {
  identifier: string;
  isEmail: boolean;
  email: string | null;
  visits: number;
  totalDuration: number;
  maxCompletionRate: number;
  lastVisit: string;
  firstVisit: string;
  score: number;
  tier: 'cold' | 'warm' | 'hot';
  documentsCount: number;
}

export interface DocumentPerformance {
  documentId: number;
  title: string;
  totalViews: number;
  uniqueViewers: number;
  avgDuration: number;
  avgCompletion: number;
  engagementScore: number;
}

export interface LiveSummary {
  totalViewers: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  activeSessions: number;
  totalViews30d: number;
}
