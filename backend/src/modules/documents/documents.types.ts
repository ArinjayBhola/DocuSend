import { documents } from '../../db/schema.js';

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

export type FileType = 'pdf' | 'image';

export interface DocumentUpdate {
  title?: string;
  password?: string | null;
  requireEmail?: boolean;
  allowDownload?: boolean;
  expiresAt?: string | null;
  isActive?: boolean;
}
