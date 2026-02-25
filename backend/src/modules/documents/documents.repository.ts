import { eq, and, sql } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { documents } from '../../db/schema.js';
import { Document, NewDocument } from './documents.types.js';

export class DocumentsRepository {
  async findByIdAndUser(id: number, userId: number): Promise<Document | undefined> {
    return db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.userId, userId)))
      .get();
  }

  async findById(id: number): Promise<Document | undefined> {
    return db
      .select()
      .from(documents)
      .where(eq(documents.id, id))
      .get();
  }

  async findBySlug(slug: string): Promise<Document | undefined> {
    return db
      .select()
      .from(documents)
      .where(eq(documents.shareSlug, slug))
      .get();
  }

  async create(data: NewDocument): Promise<{ lastInsertRowid: number | bigint }> {
    const result = db.insert(documents).values(data).run();
    return result!;
  }

  async update(id: number, data: Partial<NewDocument>): Promise<void> {
    db.update(documents).set(data).where(eq(documents.id, id)).run();
  }

  async delete(id: number): Promise<void> {
    db.delete(documents).where(eq(documents.id, id)).run();
  }

  async countByUserId(userId: number): Promise<number> {
    const result = db
      .select({ count: sql`count(*)` })
      .from(documents)
      .where(eq(documents.userId, userId))
      .get() as { count: number };
    return Number(result.count);
  }

  async findAllByUser(userId: number): Promise<Document[]> {
    return db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .all();
  }
}
