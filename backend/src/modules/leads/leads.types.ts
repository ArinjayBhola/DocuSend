export interface LeadDocument {
  id: number;
  title: string;
  shareSlug: string;
  viewCount: number;
  avgPagesViewed: number;
  lastViewedAt: string;
}

export interface UniqueLead {
  email: string;
  totalViews: number;
  totalDuration: number;
  documents: LeadDocument[];
  firstSeen: string;
  lastSeen: string;
}

export interface LeadFetchResult {
  email: string;
  documentTitle: string;
  documentId: number;
  shareSlug: string;
  viewCount: number;
  totalDuration: number;
  firstViewedAt: string;
  lastViewedAt: string;
  avgPagesViewed: number;
}
