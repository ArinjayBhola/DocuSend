import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { workspaces, workspaceDocuments, documents } from '../../db/schema.js';
import { Workspace, NewWorkspace, NewWorkspaceDocument } from './workspaces.types.js';

export class WorkspacesRepository {
  async findAllByUser(userId: number) {
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

  async findByIdAndUser(id: number, userId: number) {
    return db
      .select()
      .from(workspaces)
      .where(and(eq(workspaces.id, id), eq(workspaces.userId, userId)))
      .get();
  }

  async findBySlug(slug: string) {
    return db.select().from(workspaces).where(eq(workspaces.slug, slug)).get();
  }

  async create(data: NewWorkspace) {
    return db.insert(workspaces).values(data).returning().get();
  }

  async delete(id: number, userId: number) {
    db.delete(workspaces).where(and(eq(workspaces.id, id), eq(workspaces.userId, userId))).run();
  }

  async getDocCount(workspaceId: number) {
    const result = db
      .select({ count: sql`count(*)` })
      .from(workspaceDocuments)
      .where(eq(workspaceDocuments.workspaceId, workspaceId))
      .get() as { count: number };
    return result.count;
  }

  async getWorkspaceDocuments(workspaceId: number) {
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

  async getMaxOrder(workspaceId: number) {
    const result = db
      .select({ max: sql`coalesce(max("order"), 0)` })
      .from(workspaceDocuments)
      .where(eq(workspaceDocuments.workspaceId, workspaceId))
      .get() as { max: number };
    return result.max;
  }

  async addDocument(data: NewWorkspaceDocument) {
    db.insert(workspaceDocuments).values(data).run();
  }

  async removeDocument(wdId: number) {
    db.delete(workspaceDocuments).where(eq(workspaceDocuments.id, wdId)).run();
  }
}
