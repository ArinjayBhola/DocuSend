export interface PublicDocMetadata {
  id: number;
  title: string;
  fileName: string;
  shareSlug: string;
  allowDownload: boolean;
  requiresPassword: boolean;
  requiresEmail: boolean;
}

export interface ViewStartInput {
  documentId: number;
  viewerEmail?: string | null;
  totalPages: number;
}

export interface PageEventInput {
  viewId: number;
  pageNumber: number;
  timeSpent: number;
}
