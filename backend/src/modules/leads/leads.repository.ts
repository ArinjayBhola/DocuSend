import { eq, sql, desc, isNotNull, and } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { documents, documentViews } from '../../db/schema.js';
import { LeadFetchResult } from './leads.types.js';

export class LeadsRepository {
  async findLeadsByUser(userId: number): Promise<LeadFetchResult[]> {
    return db
      .select({
        email: documentViews.viewerEmail,
        documentTitle: documents.title,
        documentId: documents.id,
        shareSlug: documents.shareSlug,
        viewCount: sql`cast(count(*) as integer)`.as('view_count'),
        totalDuration: sql`cast(coalesce(sum(${documentViews.duration}), 0) as integer)`.as('total_duration'),
        firstViewedAt: sql`min(${documentViews.viewedAt})`.as('first_viewed_at'),
        lastViewedAt: sql`max(${documentViews.viewedAt})`.as('last_viewed_at'),
        avgPagesViewed: sql`round(avg(${documentViews.pagesViewed}), 1)`.as('avg_pages_viewed'),
      })
      .from(documentViews)
      .innerJoin(documents, eq(documentViews.documentId, documents.id))
      .where(
        and(
          eq(documents.userId, userId),
          isNotNull(documentViews.viewerEmail),
          sql`${documentViews.viewerEmail} != ''`
        )
      )
      .groupBy(documentViews.viewerEmail, documents.id)
      .orderBy(desc(sql`max(${documentViews.viewedAt})`))
      .all() as any; // Cast due to complex SQL expressions
  }
}
