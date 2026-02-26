import { smartLinks } from '../../db/schema.js';

export type SmartLink = typeof smartLinks.$inferSelect;
export type NewSmartLink = typeof smartLinks.$inferInsert;

export interface CreateSmartLinkInput {
  documentId: number;
  recipientEmail: string;
  recipientName?: string;
  allowDownload?: boolean;
  requirePassword?: boolean;
  password?: string;
  expiresAt?: string;
  maxViews?: number;
}

export interface UpdateSmartLinkInput {
  recipientName?: string;
  allowDownload?: boolean;
  requirePassword?: boolean;
  password?: string | null;
  expiresAt?: string | null;
  isActive?: boolean;
  maxViews?: number | null;
}

export interface SmartLinkWithAnalytics extends SmartLink {
  documentTitle: string;
  totalDuration: number;
  totalPagesViewed: number;
  totalPages: number;
  uniqueVisits: number;
}

export interface SmartLinkViewDetail {
  id: number;
  viewerIp: string | null;
  userAgent: string | null;
  duration: number | null;
  pagesViewed: number | null;
  totalPages: number | null;
  viewedAt: string;
}
