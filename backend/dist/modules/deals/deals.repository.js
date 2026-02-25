import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { deals, stakeholders, dealActivities, workspaces, workspaceDocuments, documents, documentViews } from '../../db/schema.js';
export class DealsRepository {
    async findAllByUser(userId) {
        return db
            .select({
            id: deals.id,
            workspaceId: deals.workspaceId,
            accountName: deals.accountName,
            stage: deals.stage,
            value: deals.value,
            currency: deals.currency,
            closeDate: deals.closeDate,
            healthStatus: deals.healthStatus,
            createdAt: deals.createdAt,
            workspaceName: workspaces.name,
        })
            .from(deals)
            .innerJoin(workspaces, eq(deals.workspaceId, workspaces.id))
            .where(eq(deals.userId, userId))
            .orderBy(desc(deals.updatedAt))
            .all();
    }
    async findByIdAndUser(id, userId) {
        return db
            .select({
            id: deals.id,
            userId: deals.userId,
            workspaceId: deals.workspaceId,
            accountName: deals.accountName,
            stage: deals.stage,
            value: deals.value,
            currency: deals.currency,
            closeDate: deals.closeDate,
            stageEnteredAt: deals.stageEnteredAt,
            healthStatus: deals.healthStatus,
            createdAt: deals.createdAt,
            updatedAt: deals.updatedAt,
            workspaceName: workspaces.name,
        })
            .from(deals)
            .innerJoin(workspaces, eq(deals.workspaceId, workspaces.id))
            .where(and(eq(deals.id, id), eq(deals.userId, userId)))
            .get();
    }
    async create(data) {
        return db.insert(deals).values(data).returning().get();
    }
    async update(id, data) {
        db.update(deals).set(data).where(eq(deals.id, id)).run();
    }
    async delete(id) {
        db.delete(deals).where(eq(deals.id, id)).run();
    }
    async findByWorkspaceId(workspaceId, userId) {
        return db
            .select()
            .from(deals)
            .where(and(eq(deals.workspaceId, workspaceId), eq(deals.userId, userId)))
            .get();
    }
    async addActivity(data) {
        db.insert(dealActivities).values(data).run();
    }
    async getStakeholderCount(dealId) {
        const result = db
            .select({ count: sql `count(*)` })
            .from(stakeholders)
            .where(eq(stakeholders.dealId, dealId))
            .get();
        return result.count;
    }
    async getStakeholders(dealId) {
        return db.select().from(stakeholders).where(eq(stakeholders.dealId, dealId)).all();
    }
    async addStakeholder(data) {
        return db.insert(stakeholders).values(data).returning().get();
    }
    async updateStakeholder(id, dealId, data) {
        db.update(stakeholders)
            .set(data)
            .where(and(eq(stakeholders.id, id), eq(stakeholders.dealId, dealId)))
            .run();
    }
    async deleteStakeholder(id, dealId) {
        db.delete(stakeholders)
            .where(and(eq(stakeholders.id, id), eq(stakeholders.dealId, dealId)))
            .run();
    }
    async getWorkspaceDocuments(workspaceId, userId) {
        return db
            .select({
            documentId: workspaceDocuments.documentId,
            title: documents.title,
        })
            .from(workspaceDocuments)
            .innerJoin(documents, eq(workspaceDocuments.documentId, documents.id))
            .where(and(eq(workspaceDocuments.workspaceId, workspaceId), eq(documents.userId, userId)))
            .all();
    }
    async getViewsForDocuments(docIds) {
        if (!docIds.length)
            return [];
        return db
            .select({
            id: documentViews.id,
            documentId: documentViews.documentId,
            viewerEmail: documentViews.viewerEmail,
            duration: documentViews.duration,
            pagesViewed: documentViews.pagesViewed,
            totalPages: documentViews.totalPages,
            viewedAt: documentViews.viewedAt,
            documentTitle: documents.title,
        })
            .from(documentViews)
            .innerJoin(documents, eq(documentViews.documentId, documents.id))
            .where(inArray(documentViews.documentId, docIds))
            .orderBy(desc(documentViews.viewedAt))
            .all();
    }
    async countDealsByUserId(userId) {
        const result = db
            .select({ count: sql `count(*)` })
            .from(deals)
            .where(eq(deals.userId, userId))
            .get();
        return result.count;
    }
}
