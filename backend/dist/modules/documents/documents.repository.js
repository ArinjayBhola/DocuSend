import { eq, and, sql } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { documents } from '../../db/schema.js';
export class DocumentsRepository {
    async findByIdAndUser(id, userId) {
        return db
            .select()
            .from(documents)
            .where(and(eq(documents.id, id), eq(documents.userId, userId)))
            .get();
    }
    async create(data) {
        const result = db.insert(documents).values(data).run();
        return result;
    }
    async update(id, data) {
        db.update(documents).set(data).where(eq(documents.id, id)).run();
    }
    async delete(id) {
        db.delete(documents).where(eq(documents.id, id)).run();
    }
    async countByUserId(userId) {
        const result = db
            .select({ count: sql `count(*)` })
            .from(documents)
            .where(eq(documents.userId, userId))
            .get();
        return Number(result.count);
    }
}
