import { SessionsService } from './sessions.service.js';
import { SessionsRepository } from './sessions.repository.js';
import { sessionManager } from './session-manager.service.js';
import { createSessionSchema, joinSessionSchema, presenceSchema, createAnnotationSchema, updateAnnotationSchema, createMessageSchema } from './sessions.validation.js';
export class SessionsController {
    service;
    repository;
    constructor() {
        this.service = new SessionsService();
        this.repository = new SessionsRepository();
    }
    list = async (req, res) => {
        const sessions = await this.service.listUserSessions(req.userId);
        res.json({ sessions });
    };
    create = async (req, res) => {
        const validated = createSessionSchema.parse(req.body);
        const session = await this.service.createSession(req.userId, validated);
        res.json({ session });
    };
    getOne = async (req, res) => {
        const id = parseInt(req.params.id);
        const result = await this.service.getSessionDetail(id, req.userId);
        res.json(result);
    };
    join = async (req, res) => {
        const validated = joinSessionSchema.parse(req.body);
        const session = await this.service.joinSession(req.userId, validated, req.user.name);
        res.json({ session });
    };
    start = async (req, res) => {
        const id = parseInt(req.params.id);
        await this.service.startSession(id, req.userId);
        res.json({ ok: true });
    };
    end = async (req, res) => {
        const id = parseInt(req.params.id);
        await this.service.endSession(id, req.userId);
        res.json({ ok: true });
    };
    leave = async (req, res) => {
        const id = parseInt(req.params.id);
        await this.service.leaveSession(id, req.userId, req.user.name);
        res.json({ ok: true });
    };
    stream = async (req, res) => {
        const sessionId = parseInt(req.params.id);
        const userId = req.userId;
        const userName = req.user.name;
        const participant = await this.repository.findParticipant(sessionId, userId);
        if (!participant)
            return res.status(403).json({ error: 'Not a participant' });
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        });
        const room = sessionManager.getOrCreateRoom(sessionId);
        if (!room.participants.has(userId)) {
            room.participants.set(userId, {
                userId,
                name: userName,
                color: participant.color,
                currentPage: 1,
                cursorX: 0,
                cursorY: 0,
                lastActivity: Date.now(),
                sseRes: new Set([res]),
            });
        }
        else {
            room.participants.get(userId).sseRes.add(res);
        }
        // Init state
        const participantsList = Array.from(room.participants.values()).map(p => ({
            userId: p.userId,
            name: p.name,
            color: p.color,
            currentPage: p.currentPage,
            cursorX: p.cursorX,
            cursorY: p.cursorY,
        }));
        const annotations = await this.repository.getAnnotations(sessionId);
        const messages = await this.repository.getMessages(sessionId);
        res.write(`data: ${JSON.stringify({
            type: 'init',
            participants: participantsList,
            annotations: annotations.map(a => ({ ...a, data: JSON.parse(a.data) })),
            messages,
        })}\n\n`);
        // Broadcast join
        sessionManager.broadcast(sessionId, {
            type: 'participant_joined',
            userId,
            name: userName,
            color: participant.color,
            currentPage: 1,
        }, userId);
        const heartbeat = setInterval(() => {
            try {
                res.write(': heartbeat\n\n');
            }
            catch {
                clearInterval(heartbeat);
            }
        }, 15000);
        req.on('close', () => {
            clearInterval(heartbeat);
            sessionManager.removeParticipant(sessionId, userId, res);
            sessionManager.broadcast(sessionId, {
                type: 'participant_left',
                userId,
                name: userName,
            });
        });
    };
    updatePresence = async (req, res) => {
        const id = parseInt(req.params.id);
        const validated = presenceSchema.parse(req.body);
        const p = sessionManager.updatePresence(id, req.userId, validated);
        if (p) {
            sessionManager.broadcast(id, {
                type: 'presence_update',
                userId: req.userId,
                name: req.user.name,
                currentPage: p.currentPage,
                cursorX: p.cursorX,
                cursorY: p.cursorY,
            }, req.userId);
        }
        res.json({ ok: true });
    };
    addAnnotation = async (req, res) => {
        const id = parseInt(req.params.id);
        const validated = createAnnotationSchema.parse(req.body);
        const annotation = await this.service.createAnnotation(id, req.userId, req.user.name, validated);
        res.json({ annotation });
    };
    updateAnnotation = async (req, res) => {
        const id = parseInt(req.params.id);
        const aid = parseInt(req.params.aid);
        const validated = updateAnnotationSchema.parse(req.body);
        const annotation = await this.service.updateAnnotation(id, aid, req.user.name, validated);
        res.json({ annotation });
    };
    deleteAnnotation = async (req, res) => {
        const id = parseInt(req.params.id);
        const aid = parseInt(req.params.aid);
        await this.service.deleteAnnotation(id, aid);
        res.json({ ok: true });
    };
    getAnnotations = async (req, res) => {
        const id = parseInt(req.params.id);
        const annotations = await this.repository.getAnnotations(id);
        res.json({ annotations: annotations.map(a => ({ ...a, data: JSON.parse(a.data) })) });
    };
    addMessage = async (req, res) => {
        const id = parseInt(req.params.id);
        const validated = createMessageSchema.parse(req.body);
        const message = await this.service.sendMessage(id, req.userId, req.user.name, validated);
        res.json({ message });
    };
    getMessages = async (req, res) => {
        const id = parseInt(req.params.id);
        const messages = await this.repository.getMessages(id);
        res.json({ messages });
    };
    raiseHand = async (req, res) => {
        const id = parseInt(req.params.id);
        const raised = sessionManager.toggleHandRaise(id, req.userId);
        sessionManager.broadcast(id, {
            type: 'hand_raise',
            userId: req.userId,
            name: req.user.name,
            raised,
        });
        res.json({ ok: true, raised });
    };
}
