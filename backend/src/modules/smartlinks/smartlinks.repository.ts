import { eq, and, sql, desc } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { smartLinks, documents, documentViews } from '../../db/schema.js';
import { SmartLink, NewSmartLink, SmartLinkWithAnalytics, SmartLinkViewDetail } from './smartlinks.types.js';

export class SmartLinksRepository {
  async create(data: NewSmartLink): Promise<SmartLink> {
    const result = db.insert(smartLinks).values(data).returning().get();
    return result;
  }

  async findById(id: number): Promise<SmartLink | undefined> {
    return db.select().from(smartLinks).where(eq(smartLinks.id, id)).get();
  }

  async findByIdAndUser(id: number, userId: number): Promise<SmartLink | undefined> {
    return db
      .select()
      .from(smartLinks)
      .where(and(eq(smartLinks.id, id), eq(smartLinks.userId, userId)))
      .get();
  }

  async findBySlug(slug: string): Promise<SmartLink | undefined> {
    return db.select().from(smartLinks).where(eq(smartLinks.slug, slug)).get();
  }

  async findAllByUser(userId: number, documentId?: number): Promise<SmartLinkWithAnalytics[]> {
    const conditions = [eq(smartLinks.userId, userId)];
    if (documentId) {
      conditions.push(eq(smartLinks.documentId, documentId));
    }

    const links = db
      .select({
        id: smartLinks.id,
        userId: smartLinks.userId,
        documentId: smartLinks.documentId,
        slug: smartLinks.slug,
        recipientEmail: smartLinks.recipientEmail,
        recipientName: smartLinks.recipientName,
        allowDownload: smartLinks.allowDownload,
        requirePassword: smartLinks.requirePassword,
        password: smartLinks.password,
        expiresAt: smartLinks.expiresAt,
        isActive: smartLinks.isActive,
        maxViews: smartLinks.maxViews,
        viewCount: smartLinks.viewCount,
        lastViewedAt: smartLinks.lastViewedAt,
        createdAt: smartLinks.createdAt,
        documentTitle: documents.title,
        totalDuration: sql<number>`coalesce(sum(${documentViews.duration}), 0)`,
        totalPagesViewed: sql<number>`coalesce(sum(${documentViews.pagesViewed}), 0)`,
        totalPages: sql<number>`coalesce(max(${documentViews.totalPages}), 0)`,
        uniqueVisits: sql<number>`count(${documentViews.id})`,
      })
      .from(smartLinks)
      .innerJoin(documents, eq(smartLinks.documentId, documents.id))
      .leftJoin(documentViews, eq(documentViews.smartLinkId, smartLinks.id))
      .where(and(...conditions))
      .groupBy(smartLinks.id)
      .orderBy(desc(smartLinks.createdAt))
      .all();

    return links as SmartLinkWithAnalytics[];
  }

  async update(id: number, data: Partial<NewSmartLink>): Promise<void> {
    db.update(smartLinks).set(data).where(eq(smartLinks.id, id)).run();
  }

  async delete(id: number): Promise<void> {
    db.delete(smartLinks).where(eq(smartLinks.id, id)).run();
  }

  async incrementViewCount(id: number): Promise<void> {
    db.update(smartLinks)
      .set({
        viewCount: sql`${smartLinks.viewCount} + 1`,
        lastViewedAt: new Date().toISOString(),
      })
      .where(eq(smartLinks.id, id))
      .run();
  }

  async countByUser(userId: number): Promise<number> {
    const result = db
      .select({ count: sql<number>`count(*)` })
      .from(smartLinks)
      .where(eq(smartLinks.userId, userId))
      .get() as { count: number };
    return Number(result.count);
  }

  async getViewsForLink(linkId: number): Promise<SmartLinkViewDetail[]> {
    return db
      .select({
        id: documentViews.id,
        viewerIp: documentViews.viewerIp,
        userAgent: documentViews.userAgent,
        duration: documentViews.duration,
        pagesViewed: documentViews.pagesViewed,
        totalPages: documentViews.totalPages,
        viewedAt: documentViews.viewedAt,
      })
      .from(documentViews)
      .where(eq(documentViews.smartLinkId, linkId))
      .orderBy(desc(documentViews.viewedAt))
      .all();
  }
}
