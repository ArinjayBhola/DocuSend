import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { documents, documentViews } from '../../db/schema.js';

export class DashboardRepository {
  async getDocsWithStats(userId: number) {
    const userDocs = db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.createdAt))
      .all();

    return Promise.all(userDocs.map(async (doc) => {
      const viewStats = db
        .select({
          viewCount: sql`cast(count(*) as integer)`,
          totalDuration: sql`cast(coalesce(sum(duration), 0) as integer)`,
        })
        .from(documentViews)
        .where(eq(documentViews.documentId, doc.id))
        .get() as any;

      const lastView = db
        .select({ viewedAt: documentViews.viewedAt })
        .from(documentViews)
        .where(eq(documentViews.documentId, doc.id))
        .orderBy(desc(documentViews.viewedAt))
        .limit(1)
        .get();

      return {
        ...doc,
        viewCount: viewStats?.viewCount || 0,
        totalDuration: viewStats?.totalDuration || 0,
        lastViewedAt: lastView?.viewedAt,
      };
    }));
  }
}
