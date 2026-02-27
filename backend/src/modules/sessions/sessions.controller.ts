import { Request, Response } from 'express';
import { SessionsService } from './sessions.service.js';
import { SessionsRepository } from './sessions.repository.js';
import { sessionManager } from './session-manager.service.js';
import { 
  createSessionSchema, 
  joinSessionSchema, 
  presenceSchema, 
  createAnnotationSchema, 
  updateAnnotationSchema, 
  createMessageSchema 
} from './sessions.validation.js';

export class SessionsController {
  private service: SessionsService;
  private repository: SessionsRepository;

  constructor() {
    this.service = new SessionsService();
    this.repository = new SessionsRepository();
  }

  list = async (req: Request, res: Response) => {
    const sessions = await this.service.listUserSessions(req.userId!);
    res.json({ sessions });
  };

  create = async (req: Request, res: Response) => {
    const validated = createSessionSchema.parse(req.body);
    const session = await this.service.createSession(req.userId!, validated);
    res.json({ session });
  };

  getOne = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    const result = await this.service.getSessionDetail(id, req.userId!);
    res.json(result);
  };

  join = async (req: Request, res: Response) => {
    const validated = joinSessionSchema.parse(req.body);
    const session = await this.service.joinSession(req.userId!, validated, req.user!.name);
    res.json({ session });
  };

  start = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    await this.service.startSession(id, req.userId!);
    res.json({ ok: true });
  };

  end = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    await this.service.endSession(id, req.userId!);
    res.json({ ok: true });
  };

  leave = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    await this.service.leaveSession(id, req.userId!, req.user!.name);
    res.json({ ok: true });
  };

  stream = async (req: Request, res: Response) => {
    const sessionId = parseInt(req.params.id as string);
    const userId = req.userId!;
    const userName = req.user!.name;

    const participant = await this.repository.findParticipant(sessionId, userId);
    if (!participant) return res.status(403).json({ error: 'Not a participant' });

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
    } else {
      room.participants.get(userId)!.sseRes.add(res);
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
      try { res.write(': heartbeat\n\n'); } catch { clearInterval(heartbeat); }
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

  updatePresence = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    const validated = presenceSchema.parse(req.body);
    const p = sessionManager.updatePresence(id, req.userId!, validated);
    
    if (p) {
      sessionManager.broadcast(id, {
        type: 'presence_update',
        userId: req.userId!,
        name: req.user!.name,
        currentPage: p.currentPage,
        cursorX: p.cursorX,
        cursorY: p.cursorY,
      }, req.userId!);
    }
    res.json({ ok: true });
  };

  addAnnotation = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    const validated = createAnnotationSchema.parse(req.body);
    const annotation = await this.service.createAnnotation(id, req.userId!, req.user!.name, validated);
    res.json({ annotation });
  };

  updateAnnotation = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    const aid = parseInt(req.params.aid as string);
    const validated = updateAnnotationSchema.parse(req.body);
    const annotation = await this.service.updateAnnotation(id, aid, req.user!.name, validated);
    res.json({ annotation });
  };

  deleteAnnotation = async (req: Request, res: Response) => {
     const id = parseInt(req.params.id as string);
     const aid = parseInt(req.params.aid as string);
     await this.service.deleteAnnotation(id, aid);
     res.json({ ok: true });
  };

  getAnnotations = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    const annotations = await this.repository.getAnnotations(id);
    res.json({ annotations: annotations.map(a => ({ ...a, data: JSON.parse(a.data) })) });
  };

  addMessage = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    const validated = createMessageSchema.parse(req.body);
    const message = await this.service.sendMessage(id, req.userId!, req.user!.name, validated);
    res.json({ message });
  };

  getMessages = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    const messages = await this.repository.getMessages(id);
    res.json({ messages });
  };

  raiseHand = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    const raised = sessionManager.toggleHandRaise(id, req.userId!);
    sessionManager.broadcast(id, {
      type: 'hand_raise',
      userId: req.userId!,
      name: req.user!.name,
      raised,
    });
    res.json({ ok: true, raised });
  };

  screenShare = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    const sharing = sessionManager.toggleScreenShare(id, req.userId!);
    sessionManager.broadcast(id, {
      type: 'screen_share',
      userId: req.userId!,
      name: req.user!.name,
      sharing,
    });
    res.json({ ok: true, sharing });
  };

  typing = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    const { isTyping } = req.body;
    sessionManager.setTyping(id, req.userId!, !!isTyping);
    sessionManager.broadcast(id, {
      type: isTyping ? 'typing_start' : 'typing_stop',
      userId: req.userId!,
      name: req.user!.name,
    }, req.userId!);
    res.json({ ok: true });
  };

  signal = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    const { targetUserId, type, payload } = req.body;

    // Send signal to the target user via SSE
    const room = sessionManager.getOrCreateRoom(id);
    const targetParticipant = room.participants.get(targetUserId);
    if (targetParticipant) {
      const signalData = JSON.stringify({
        type: 'signal',
        fromUserId: req.userId!,
        signalType: type,
        payload,
      });
      for (const sseRes of targetParticipant.sseRes) {
        try {
          sseRes.write(`data: ${signalData}\n\n`);
        } catch {
          // Dead connection
        }
      }
    }
    res.json({ ok: true });
  };
}
