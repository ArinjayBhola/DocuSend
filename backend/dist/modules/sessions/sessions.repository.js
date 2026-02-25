import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { sessions, sessionParticipants, sessionMessages, annotations, documents, users } from '../../db/schema.js';
export class SessionsRepository {
    async create(data) {
        return db.insert(sessions).values(data).returning().get();
    }
    async findById(id) {
        return db.select().from(sessions).where(eq(sessions.id, id)).get();
    }
    async findByCode(code) {
        return db.select().from(sessions).where(eq(sessions.code, code)).get();
    }
    async update(id, data) {
        db.update(sessions).set(data).where(eq(sessions.id, id)).run();
    }
    async delete(id) {
        db.delete(sessions).where(eq(sessions.id, id)).run();
    }
    async findOwnedSessions(userId) {
        return db
            .select({
            id: sessions.id,
            title: sessions.title,
            code: sessions.code,
            status: sessions.status,
            documentId: sessions.documentId,
            documentTitle: documents.title,
            maxParticipants: sessions.maxParticipants,
            startedAt: sessions.startedAt,
            endedAt: sessions.endedAt,
            createdAt: sessions.createdAt,
        })
            .from(sessions)
            .innerJoin(documents, eq(sessions.documentId, documents.id))
            .where(eq(sessions.userId, userId))
            .orderBy(desc(sessions.createdAt))
            .all();
    }
    async findJoinedSessions(userId) {
        return db
            .select({
            id: sessions.id,
            title: sessions.title,
            code: sessions.code,
            status: sessions.status,
            documentId: sessions.documentId,
            documentTitle: documents.title,
            maxParticipants: sessions.maxParticipants,
            startedAt: sessions.startedAt,
            endedAt: sessions.endedAt,
            createdAt: sessions.createdAt,
        })
            .from(sessionParticipants)
            .innerJoin(sessions, eq(sessionParticipants.sessionId, sessions.id))
            .innerJoin(documents, eq(sessions.documentId, documents.id))
            .where(and(eq(sessionParticipants.userId, userId), sql `${sessions.userId} != ${userId}`))
            .orderBy(desc(sessions.createdAt))
            .all();
    }
    async findSessionDetail(id) {
        return db
            .select({
            id: sessions.id,
            userId: sessions.userId,
            title: sessions.title,
            code: sessions.code,
            status: sessions.status,
            documentId: sessions.documentId,
            documentTitle: documents.title,
            shareSlug: documents.shareSlug,
            fileType: documents.fileType,
            maxParticipants: sessions.maxParticipants,
            startedAt: sessions.startedAt,
            endedAt: sessions.endedAt,
            createdAt: sessions.createdAt,
        })
            .from(sessions)
            .innerJoin(documents, eq(sessions.documentId, documents.id))
            .where(eq(sessions.id, id))
            .get();
    }
    async getParticipantCount(sessionId) {
        const result = db
            .select({ count: sql `count(*)` })
            .from(sessionParticipants)
            .where(and(eq(sessionParticipants.sessionId, sessionId), sql `left_at IS NULL`))
            .get();
        return result.count;
    }
    async findParticipant(sessionId, userId) {
        return db
            .select()
            .from(sessionParticipants)
            .where(and(eq(sessionParticipants.sessionId, sessionId), eq(sessionParticipants.userId, userId)))
            .get();
    }
    async getParticipants(sessionId) {
        return db
            .select({
            id: sessionParticipants.id,
            userId: sessionParticipants.userId,
            name: users.name,
            email: users.email,
            role: sessionParticipants.role,
            color: sessionParticipants.color,
            joinedAt: sessionParticipants.joinedAt,
            leftAt: sessionParticipants.leftAt,
        })
            .from(sessionParticipants)
            .innerJoin(users, eq(sessionParticipants.userId, users.id))
            .where(eq(sessionParticipants.sessionId, sessionId))
            .all();
    }
    async addParticipant(data) {
        return db.insert(sessionParticipants).values(data).returning().get();
    }
    async updateParticipant(id, data) {
        db.update(sessionParticipants).set(data).where(eq(sessionParticipants.id, id)).run();
    }
    async getAnnotations(sessionId) {
        return db
            .select({
            id: annotations.id,
            userId: annotations.userId,
            userName: users.name,
            pageNumber: annotations.pageNumber,
            type: annotations.type,
            data: annotations.data,
            color: annotations.color,
            resolved: annotations.resolved,
            createdAt: annotations.createdAt,
        })
            .from(annotations)
            .innerJoin(users, eq(annotations.userId, users.id))
            .where(eq(annotations.sessionId, sessionId))
            .orderBy(annotations.createdAt)
            .all();
    }
    async createAnnotation(data) {
        return db.insert(annotations).values(data).returning().get();
    }
    async updateAnnotation(id, data) {
        db.update(annotations).set(data).where(eq(annotations.id, id)).run();
    }
    async deleteAnnotation(id, sessionId) {
        db.delete(annotations).where(and(eq(annotations.id, id), eq(annotations.sessionId, sessionId))).run();
    }
    async findAnnotationById(id) {
        return db.select().from(annotations).where(eq(annotations.id, id)).get();
    }
    async getMessages(sessionId) {
        return db
            .select({
            id: sessionMessages.id,
            userId: sessionMessages.userId,
            userName: users.name,
            content: sessionMessages.content,
            annotationId: sessionMessages.annotationId,
            createdAt: sessionMessages.createdAt,
        })
            .from(sessionMessages)
            .innerJoin(users, eq(sessionMessages.userId, users.id))
            .where(eq(sessionMessages.sessionId, sessionId))
            .orderBy(sessionMessages.createdAt)
            .all();
    }
    async createMessage(data) {
        return db.insert(sessionMessages).values(data).returning().get();
    }
    async countSessionsByUserId(userId) {
        const result = db
            .select({ count: sql `count(*)` })
            .from(sessions)
            .where(eq(sessions.userId, userId))
            .get();
        return result.count;
    }
}
