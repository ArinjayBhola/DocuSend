import { eq, and, desc, gte } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { documents, documentViews } from '../../db/schema.js';
export class LiveRepository {
    async getRecentViews(userId, days = 30) {
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        return db
            .select({
            viewId: documentViews.id,
            documentId: documentViews.documentId,
            documentTitle: documents.title,
            viewerEmail: documentViews.viewerEmail,
            viewerIp: documentViews.viewerIp,
            duration: documentViews.duration,
            pagesViewed: documentViews.pagesViewed,
            totalPages: documentViews.totalPages,
            viewedAt: documentViews.viewedAt,
        })
            .from(documentViews)
            .innerJoin(documents, eq(documentViews.documentId, documents.id))
            .where(and(eq(documents.userId, userId), gte(documentViews.viewedAt, cutoff)))
            .orderBy(desc(documentViews.viewedAt))
            .all();
    }
}
