import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { workspaces, workspaceDocuments, documents } from '../../db/schema.js';
export class WorkspacesRepository {
    async findAllByUser(userId) {
        return db
            .select({
            id: workspaces.id,
            userId: workspaces.userId,
            name: workspaces.name,
            slug: workspaces.slug,
            description: workspaces.description,
            createdAt: workspaces.createdAt,
        })
            .from(workspaces)
            .where(eq(workspaces.userId, userId))
            .orderBy(desc(workspaces.createdAt))
            .all();
    }
    async findByIdAndUser(id, userId) {
        return db
            .select()
            .from(workspaces)
            .where(and(eq(workspaces.id, id), eq(workspaces.userId, userId)))
            .get();
    }
    async findBySlug(slug) {
        return db.select().from(workspaces).where(eq(workspaces.slug, slug)).get();
    }
    async create(data) {
        return db.insert(workspaces).values(data).returning().get();
    }
    async delete(id, userId) {
        db.delete(workspaces).where(and(eq(workspaces.id, id), eq(workspaces.userId, userId))).run();
    }
    async getDocCount(workspaceId) {
        const result = db
            .select({ count: sql `count(*)` })
            .from(workspaceDocuments)
            .where(eq(workspaceDocuments.workspaceId, workspaceId))
            .get();
        return result.count;
    }
    async getWorkspaceDocuments(workspaceId) {
        return db
            .select({
            id: workspaceDocuments.id,
            order: workspaceDocuments.order,
            docId: documents.id,
            title: documents.title,
            fileName: documents.fileName,
            fileSize: documents.fileSize,
            shareSlug: documents.shareSlug,
            createdAt: documents.createdAt,
        })
            .from(workspaceDocuments)
            .innerJoin(documents, eq(workspaceDocuments.documentId, documents.id))
            .where(eq(workspaceDocuments.workspaceId, workspaceId))
            .orderBy(workspaceDocuments.order)
            .all();
    }
    async getMaxOrder(workspaceId) {
        const result = db
            .select({ max: sql `coalesce(max("order"), 0)` })
            .from(workspaceDocuments)
            .where(eq(workspaceDocuments.workspaceId, workspaceId))
            .get();
        return result.max;
    }
    async addDocument(data) {
        db.insert(workspaceDocuments).values(data).run();
    }
    async removeDocument(wdId) {
        db.delete(workspaceDocuments).where(eq(workspaceDocuments.id, wdId)).run();
    }
}
