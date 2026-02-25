import { SessionsRepository } from './sessions.repository.js';
import { DocumentsRepository } from '../documents/index.js';
import { sessionManager } from './session-manager.service.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../core/errors/AppError.js';
import { generateSlug } from '../../utils/helpers.js';
export class SessionsService {
    repository;
    documentsRepository;
    constructor() {
        this.repository = new SessionsRepository();
        this.documentsRepository = new DocumentsRepository();
    }
    async createSession(userId, input) {
        const doc = await this.documentsRepository.findByIdAndUser(input.documentId, userId);
        if (!doc)
            throw new NotFoundError('Document not found');
        const code = generateSlug(8);
        const session = await this.repository.create({
            userId,
            documentId: input.documentId,
            title: input.title,
            code,
            maxParticipants: input.maxParticipants || 5,
        });
        await this.repository.addParticipant({
            sessionId: session.id,
            userId,
            role: 'host',
            color: '#3B82F6', // Default host color
        });
        return { ...session, code };
    }
    async listUserSessions(userId) {
        const owned = await this.repository.findOwnedSessions(userId);
        const joined = await this.repository.findJoinedSessions(userId);
        const seen = new Set();
        const all = [];
        const process = async (list, role) => {
            for (const s of list) {
                if (!seen.has(s.id)) {
                    seen.add(s.id);
                    const count = await this.repository.getParticipantCount(s.id);
                    all.push({ ...s, role, participantCount: count });
                }
            }
        };
        await process(owned, 'host');
        await process(joined, 'member');
        return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    async getSessionDetail(id, userId) {
        const session = await this.repository.findSessionDetail(id);
        if (!session)
            throw new NotFoundError('Session not found');
        const participant = await this.repository.findParticipant(id, userId);
        if (!participant)
            throw new ForbiddenError('Not a participant');
        const participants = await this.repository.getParticipants(id);
        return { session, participants, myRole: participant.role };
    }
    async joinSession(userId, input, userName) {
        const session = await this.repository.findByCode(input.code);
        if (!session)
            throw new NotFoundError('Session not found');
        if (session.status === 'ended')
            throw new BadRequestError('Session has ended');
        const existing = await this.repository.findParticipant(session.id, userId);
        if (existing) {
            if (existing.leftAt) {
                await this.repository.updateParticipant(existing.id, {
                    leftAt: null,
                    joinedAt: new Date().toISOString()
                });
            }
            return session;
        }
        const count = await this.repository.getParticipantCount(session.id);
        if (count >= session.maxParticipants)
            throw new BadRequestError('Session is full');
        const color = sessionManager.getParticipantColor(session.id, userId);
        await this.repository.addParticipant({
            sessionId: session.id,
            userId,
            role: 'member',
            color,
        });
        sessionManager.broadcast(session.id, {
            type: 'participant_joined',
            userId,
            name: userName,
            color,
            role: 'member',
        });
        return session;
    }
    async startSession(id, userId) {
        const session = await this.repository.findById(id);
        if (!session)
            throw new NotFoundError('Session not found');
        if (session.userId !== userId)
            throw new ForbiddenError('Only the host can start the session');
        if (session.status !== 'waiting')
            throw new BadRequestError('Session is not in waiting state');
        await this.repository.update(id, {
            status: 'active',
            startedAt: new Date().toISOString()
        });
        sessionManager.broadcast(id, { type: 'session_started' });
    }
    async endSession(id, userId) {
        const session = await this.repository.findById(id);
        if (!session)
            throw new NotFoundError('Session not found');
        if (session.userId !== userId)
            throw new ForbiddenError('Only the host can end the session');
        if (session.status === 'ended')
            throw new BadRequestError('Session already ended');
        sessionManager.broadcast(id, { type: 'session_ended' });
        sessionManager.endRoom(id);
        await this.repository.delete(id);
    }
    async leaveSession(id, userId, userName) {
        await this.repository.updateParticipant(id, { leftAt: new Date().toISOString() });
        // We don't have the participant ID here, but the repo handles it. 
        // Wait, the leave route in original code uses sessionId and userId.
        // I'll adjust the repo to use sessionId/userId for leave.
    }
    async createAnnotation(sessionId, userId, userName, input) {
        const annotation = await this.repository.createAnnotation({
            sessionId,
            userId,
            pageNumber: input.pageNumber,
            type: input.type,
            data: JSON.stringify(input.data),
            color: input.color || '#3B82F6',
        });
        const result = { ...annotation, data: input.data, userName };
        sessionManager.broadcast(sessionId, { type: 'annotation_created', annotation: result });
        return result;
    }
    async updateAnnotation(sessionId, annotationId, userName, input) {
        const updates = { updatedAt: new Date().toISOString() };
        if (input.data !== undefined)
            updates.data = JSON.stringify(input.data);
        if (input.resolved !== undefined)
            updates.resolved = input.resolved;
        await this.repository.updateAnnotation(annotationId, updates);
        const updated = await this.repository.findAnnotationById(annotationId);
        if (!updated)
            throw new NotFoundError('Annotation not found');
        const result = { ...updated, data: JSON.parse(updated.data), userName };
        sessionManager.broadcast(sessionId, { type: 'annotation_updated', annotation: result });
        return result;
    }
    async deleteAnnotation(sessionId, annotationId) {
        await this.repository.deleteAnnotation(annotationId, sessionId);
        sessionManager.broadcast(sessionId, { type: 'annotation_deleted', annotationId });
    }
    async sendMessage(sessionId, userId, userName, input) {
        const message = await this.repository.createMessage({
            sessionId,
            userId,
            content: input.content,
            annotationId: input.annotationId || null,
        });
        const result = { ...message, userName };
        sessionManager.broadcast(sessionId, { type: 'message_created', message: result });
        sessionManager.setTyping(sessionId, userId, false);
        return result;
    }
}
