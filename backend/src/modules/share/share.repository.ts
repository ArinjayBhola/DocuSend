import { eq, sql } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { documents, documentViews, pageEvents } from '../../db/schema.js';

export class ShareRepository {
  async findBySlug(slug: string) {
    return db.select().from(documents).where(eq(documents.shareSlug, slug)).get();
  }

  async createView(data: any) {
    return db.insert(documentViews).values(data).returning().get();
  }

  async addPageEvent(data: any) {
    db.insert(pageEvents).values(data).run();
  }

  async updateViewStats(viewId: number) {
    const events = db
      .select({
        uniquePages: sql`count(distinct page_number)`,
        totalTime: sql`coalesce(sum(time_spent), 0)`,
      })
      .from(pageEvents)
      .where(eq(pageEvents.viewId, viewId))
      .get() as { uniquePages: number; totalTime: number };

    db.update(documentViews)
      .set({
        pagesViewed: events.uniquePages,
        duration: Math.round((events.totalTime || 0) / 1000),
      })
      .where(eq(documentViews.id, viewId))
      .run();
  }
}
