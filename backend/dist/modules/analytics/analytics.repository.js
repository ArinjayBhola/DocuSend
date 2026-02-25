import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { documentViews, pageEvents } from '../../db/schema.js';
export class AnalyticsRepository {
    async getDocumentStats(documentId) {
        const result = db
            .select({
            totalViews: sql `cast(count(*) as integer)`,
            uniqueViewers: sql `cast(count(distinct coalesce(viewer_email, viewer_ip)) as integer)`,
            avgDuration: sql `coalesce(avg(duration), 0)`,
            totalDuration: sql `coalesce(sum(duration), 0)`,
        })
            .from(documentViews)
            .where(eq(documentViews.documentId, documentId))
            .get();
        return result;
    }
    async getRecentViewers(documentId, limit = 50) {
        return db
            .select()
            .from(documentViews)
            .where(eq(documentViews.documentId, documentId))
            .orderBy(desc(documentViews.viewedAt))
            .limit(limit)
            .all();
    }
    async getPageHeatmap(documentId) {
        return db
            .select({
            pageNumber: pageEvents.pageNumber,
            totalTime: sql `sum(time_spent)`,
            viewCount: sql `count(*)`,
        })
            .from(pageEvents)
            .innerJoin(documentViews, eq(pageEvents.viewId, documentViews.id))
            .where(eq(documentViews.documentId, documentId))
            .groupBy(pageEvents.pageNumber)
            .orderBy(pageEvents.pageNumber)
            .all();
    }
    async getViewTimeline(documentId) {
        return db
            .select({
            date: sql `date(viewed_at)`,
            count: sql `count(*)`,
        })
            .from(documentViews)
            .where(eq(documentViews.documentId, documentId))
            .groupBy(sql `date(viewed_at)`)
            .orderBy(sql `date(viewed_at)`)
            .all();
    }
}
