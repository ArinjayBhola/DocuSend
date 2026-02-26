import { eq, sql, and, desc, isNotNull } from "drizzle-orm";
import { db } from "../../config/db.js";
import { documents, documentViews, pageEvents } from "../../db/schema.js";
import { ViewerRawData } from "./engagement.types.js";

export class EngagementRepository {
  /**
   * Get aggregated viewer data for all documents owned by a user.
   * Groups by viewerEmail + documentId to compute per-viewer-per-document stats.
   */
  async getViewerDataForUser(userId: number): Promise<ViewerRawData[]> {
    const rows = db
      .select({
        viewerEmail: documentViews.viewerEmail,
        documentId: documents.id,
        documentTitle: documents.title,
        totalDuration: sql<number>`coalesce(sum(${documentViews.duration}), 0)`,
        totalPagesViewed: sql<number>`coalesce(sum(${documentViews.pagesViewed}), 0)`,
        totalPages: sql<number>`max(${documentViews.totalPages})`,
        visitCount: sql<number>`count(${documentViews.id})`,
        lastViewedAt: sql<string>`max(${documentViews.viewedAt})`,
      })
      .from(documentViews)
      .innerJoin(documents, eq(documentViews.documentId, documents.id))
      .where(and(eq(documents.userId, userId), isNotNull(documentViews.viewerEmail)))
      .groupBy(documentViews.viewerEmail, documents.id)
      .all();

    // Compute avg time per page from page events
    const result: ViewerRawData[] = [];
    for (const row of rows) {
      const pageData = db
        .select({
          avgTimePerPage: sql<number>`coalesce(avg(${pageEvents.timeSpent}), 0)`,
        })
        .from(pageEvents)
        .innerJoin(documentViews, eq(pageEvents.viewId, documentViews.id))
        .where(and(eq(documentViews.documentId, row.documentId), eq(documentViews.viewerEmail, row.viewerEmail!)))
        .get();

      result.push({
        viewerEmail: row.viewerEmail!,
        documentId: row.documentId,
        documentTitle: row.documentTitle,
        totalDuration: Number(row.totalDuration),
        totalPagesViewed: Number(row.totalPagesViewed),
        totalPages: Number(row.totalPages) || 1,
        visitCount: Number(row.visitCount),
        lastViewedAt: row.lastViewedAt,
        avgTimePerPage: Number(pageData?.avgTimePerPage || 0) / 1000, // convert ms to seconds
      });
    }

    return result;
  }

  /**
   * Get viewer data for a specific document.
   */
  async getViewerDataForDocument(userId: number, documentId: number): Promise<ViewerRawData[]> {
    const rows = db
      .select({
        viewerEmail: documentViews.viewerEmail,
        documentId: documents.id,
        documentTitle: documents.title,
        totalDuration: sql<number>`coalesce(sum(${documentViews.duration}), 0)`,
        totalPagesViewed: sql<number>`coalesce(sum(${documentViews.pagesViewed}), 0)`,
        totalPages: sql<number>`max(${documentViews.totalPages})`,
        visitCount: sql<number>`count(${documentViews.id})`,
        lastViewedAt: sql<string>`max(${documentViews.viewedAt})`,
      })
      .from(documentViews)
      .innerJoin(documents, eq(documentViews.documentId, documents.id))
      .where(and(eq(documents.userId, userId), eq(documents.id, documentId), isNotNull(documentViews.viewerEmail)))
      .groupBy(documentViews.viewerEmail)
      .all();

    const result: ViewerRawData[] = [];
    for (const row of rows) {
      const pageData = db
        .select({
          avgTimePerPage: sql<number>`coalesce(avg(${pageEvents.timeSpent}), 0)`,
        })
        .from(pageEvents)
        .innerJoin(documentViews, eq(pageEvents.viewId, documentViews.id))
        .where(and(eq(documentViews.documentId, documentId), eq(documentViews.viewerEmail, row.viewerEmail!)))
        .get();

      result.push({
        viewerEmail: row.viewerEmail!,
        documentId: row.documentId,
        documentTitle: row.documentTitle,
        totalDuration: Number(row.totalDuration),
        totalPagesViewed: Number(row.totalPagesViewed),
        totalPages: Number(row.totalPages) || 1,
        visitCount: Number(row.visitCount),
        lastViewedAt: row.lastViewedAt,
        avgTimePerPage: Number(pageData?.avgTimePerPage || 0) / 1000,
      });
    }

    return result;
  }

  /**
   * Get document-level stats for all documents owned by a user.
   */
  async getDocumentStats(userId: number) {
    return db
      .select({
        documentId: documents.id,
        title: documents.title,
        createdAt: documents.createdAt,
        totalViewers: sql<number>`count(distinct ${documentViews.viewerEmail})`,
        totalViews: sql<number>`count(${documentViews.id})`,
        avgDuration: sql<number>`coalesce(avg(${documentViews.duration}), 0)`,
        avgPagesViewed: sql<number>`coalesce(avg(${documentViews.pagesViewed}), 0)`,
        avgTotalPages: sql<number>`coalesce(avg(${documentViews.totalPages}), 1)`,
      })
      .from(documents)
      .leftJoin(documentViews, eq(documentViews.documentId, documents.id))
      .where(eq(documents.userId, userId))
      .groupBy(documents.id)
      .all();
  }

  /**
   * Count unique scored viewers for a user (for plan limit enforcement).
   */
  async countScoredViewers(userId: number): Promise<number> {
    const result = db
      .select({
        count: sql<number>`count(distinct ${documentViews.viewerEmail})`,
      })
      .from(documentViews)
      .innerJoin(documents, eq(documentViews.documentId, documents.id))
      .where(and(eq(documents.userId, userId), isNotNull(documentViews.viewerEmail)))
      .get() as { count: number };

    return Number(result.count);
  }
}
