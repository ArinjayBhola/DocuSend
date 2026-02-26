export interface PublicDocMetadata {
  id: number;
  title: string;
  fileName: string;
  shareSlug: string;
  allowDownload: boolean;
  requiresPassword: boolean;
  requiresEmail: boolean;
  smartLinkId?: number;
  recipientEmail?: string;
  recipientName?: string;
}

export interface ViewStartInput {
  documentId: number;
  viewerEmail?: string | null;
  smartLinkId?: number | null;
  totalPages: number;
}

export interface PageEventInput {
  viewId: number;
  pageNumber: number;
  timeSpent: number;
}
