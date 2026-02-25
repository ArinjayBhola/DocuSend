const express = require('express');
const { eq, sql, and, desc } = require('drizzle-orm');
const { db } = require('../config/db');
const { sessions, sessionParticipants, sessionMessages, annotations, documents, users } = require('../db/schema');
const { requireAuth, loadUser } = require('../middleware/auth');
const { checkSessionLimit } = require('../middleware/planLimits');
const { generateSlug } = require('../utils/helpers');

const router = express.Router();

// All routes require auth + loadUser
router.use(requireAuth, loadUser);

// ============================================================
// IN-MEMORY ROOM STATE
// ============================================================
const COLORS = ['#3B82F6','#EF4444','#10B981','#F59E0B','#8B5CF6','#EC4899','#06B6D4','#F97316'];

// Map<sessionId, { participants: Map<userId, {...}>, typing: Set<userId> }>
const activeRooms = new Map();

function getOrCreateRoom(sessionId) {
  if (!activeRooms.has(sessionId)) {
    activeRooms.set(sessionId, { participants: new Map(), typing: new Set() });
  }
  return activeRooms.get(sessionId);
}

function broadcastToRoom(sessionId, data, excludeUserId = null) {
  const room = activeRooms.get(sessionId);
  if (!room) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const [userId, participant] of room.participants) {
    if (userId === excludeUserId) continue;
    for (const res of participant.sseRes) {
      try { res.write(payload); } catch { /* dead connection */ }
    }
  }
}

function getParticipantColor(sessionId, userId = null) {
  const room = activeRooms.get(sessionId);
  if (room && userId && room.participants.has(userId)) {
    return room.participants.get(userId).color;
  }
  const usedColors = room ? [...room.participants.values()].map(p => p.color) : [];
  for (const c of COLORS) {
    if (!usedColors.includes(c)) return c;
  }
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

// ============================================================
// POST / — Create session
// ============================================================
router.post('/', checkSessionLimit, (req, res) => {
  try {
    const { documentId, title, maxParticipants } = req.body;
    if (!documentId || !title) {
      return res.status(400).json({ error: 'documentId and title are required' });
    }

    // Verify document belongs to user
    const doc = db.select().from(documents).where(and(eq(documents.id, documentId), eq(documents.userId, req.user.id))).get();
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const code = generateSlug(8);
    const session = db.insert(sessions).values({
      userId: req.user.id,
      documentId,
      title,
      code,
      maxParticipants: maxParticipants || 5,
    }).returning().get();

    // Add creator as host participant
    const color = COLORS[0];
    db.insert(sessionParticipants).values({
      sessionId: session.id,
      userId: req.user.id,
      role: 'host',
      color,
    }).run();

    res.json({ session: { ...session, code } });
  } catch (err) {
    console.error('[Create Session Error]', err);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// ============================================================
// GET / — List user's sessions
// ============================================================
router.get('/', (req, res) => {
  try {
    // Get sessions where user is creator or participant
    const owned = db.select({
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
      role: sql`'host'`.as('role'),
    })
      .from(sessions)
      .innerJoin(documents, eq(sessions.documentId, documents.id))
      .where(eq(sessions.userId, req.user.id))
      .orderBy(desc(sessions.createdAt))
      .all();

    const joined = db.select({
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
      role: sql`'member'`.as('role'),
    })
      .from(sessionParticipants)
      .innerJoin(sessions, eq(sessionParticipants.sessionId, sessions.id))
      .innerJoin(documents, eq(sessions.documentId, documents.id))
      .where(and(
        eq(sessionParticipants.userId, req.user.id),
        sql`${sessions.userId} != ${req.user.id}`
      ))
      .orderBy(desc(sessions.createdAt))
      .all();

    // Merge and deduplicate
    const seen = new Set();
    const all = [];
    for (const s of [...owned, ...joined]) {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        // Get participant count
        const count = db.select({ count: sql`count(*)` })
          .from(sessionParticipants)
          .where(and(eq(sessionParticipants.sessionId, s.id), sql`left_at IS NULL`))
          .get();
        all.push({ ...s, participantCount: count.count });
      }
    }

    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ sessions: all });
  } catch (err) {
    console.error('[List Sessions Error]', err);
    res.status(500).json({ error: 'Failed to list sessions' });
  }
});

// ============================================================
// GET /:id — Session detail
// ============================================================
router.get('/:id', (req, res) => {
  try {
    const session = db.select({
      id: sessions.id,
      userId: sessions.userId,
      title: sessions.title,
      code: sessions.code,
      status: sessions.status,
      documentId: sessions.documentId,
      documentTitle: documents.title,
      shareSlug: documents.shareSlug,
      maxParticipants: sessions.maxParticipants,
      startedAt: sessions.startedAt,
      endedAt: sessions.endedAt,
      createdAt: sessions.createdAt,
    })
      .from(sessions)
      .innerJoin(documents, eq(sessions.documentId, documents.id))
      .where(eq(sessions.id, parseInt(req.params.id)))
      .get();

    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Check user is participant
    const participant = db.select().from(sessionParticipants)
      .where(and(eq(sessionParticipants.sessionId, session.id), eq(sessionParticipants.userId, req.user.id)))
      .get();
    if (!participant) return res.status(403).json({ error: 'Not a participant' });

    const participants = db.select({
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
      .where(eq(sessionParticipants.sessionId, session.id))
      .all();

    res.json({ session, participants, myRole: participant.role });
  } catch (err) {
    console.error('[Session Detail Error]', err);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

// ============================================================
// POST /join — Join session by invite code
// ============================================================
router.post('/join', (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Invite code is required' });

    const session = db.select().from(sessions).where(eq(sessions.code, code.trim())).get();
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.status === 'ended') return res.status(400).json({ error: 'Session has ended' });

    // Check if already a participant
    const existing = db.select().from(sessionParticipants)
      .where(and(eq(sessionParticipants.sessionId, session.id), eq(sessionParticipants.userId, req.user.id)))
      .get();

    if (existing) {
      // Rejoin if left
      if (existing.leftAt) {
        db.update(sessionParticipants)
          .set({ leftAt: null, joinedAt: new Date().toISOString() })
          .where(eq(sessionParticipants.id, existing.id))
          .run();
      }
      return res.json({ session });
    }

    // Check capacity
    const count = db.select({ count: sql`count(*)` })
      .from(sessionParticipants)
      .where(and(eq(sessionParticipants.sessionId, session.id), sql`left_at IS NULL`))
      .get();

    if (count.count >= session.maxParticipants) {
      return res.status(400).json({ error: 'Session is full' });
    }

    const color = getParticipantColor(session.id, req.user.id);
    db.insert(sessionParticipants).values({
      sessionId: session.id,
      userId: req.user.id,
      role: 'member',
      color,
    }).run();

    // Broadcast to room
    broadcastToRoom(session.id, {
      type: 'participant_joined',
      userId: req.user.id,
      name: req.user.name,
      color,
      role: 'member',
    });

    res.json({ session });
  } catch (err) {
    console.error('[Join Session Error]', err);
    res.status(500).json({ error: 'Failed to join session' });
  }
});

// ============================================================
// POST /:id/start — Host starts session
// ============================================================
router.post('/:id/start', (req, res) => {
  try {
    const session = db.select().from(sessions).where(eq(sessions.id, parseInt(req.params.id))).get();
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.userId !== req.user.id) return res.status(403).json({ error: 'Only the host can start the session' });
    if (session.status !== 'waiting') return res.status(400).json({ error: 'Session is not in waiting state' });

    db.update(sessions)
      .set({ status: 'active', startedAt: new Date().toISOString() })
      .where(eq(sessions.id, session.id))
      .run();

    broadcastToRoom(session.id, { type: 'session_started' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[Start Session Error]', err);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// ============================================================
// POST /:id/end — Host ends session
// ============================================================
router.post('/:id/end', (req, res) => {
  try {
    const session = db.select().from(sessions).where(eq(sessions.id, parseInt(req.params.id))).get();
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.userId !== req.user.id) return res.status(403).json({ error: 'Only the host can end the session' });
    if (session.status === 'ended') return res.status(400).json({ error: 'Session already ended' });

    db.update(sessions)
      .set({ status: 'ended', endedAt: new Date().toISOString() })
      .where(eq(sessions.id, session.id))
      .run();

    broadcastToRoom(session.id, { type: 'session_ended' });
    activeRooms.delete(session.id);
    res.json({ ok: true });
  } catch (err) {
    console.error('[End Session Error]', err);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// ============================================================
// POST /:id/leave — Leave session
// ============================================================
router.post('/:id/leave', (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    db.update(sessionParticipants)
      .set({ leftAt: new Date().toISOString() })
      .where(and(eq(sessionParticipants.sessionId, sessionId), eq(sessionParticipants.userId, req.user.id)))
      .run();

    // Remove from active room
    const room = activeRooms.get(sessionId);
    if (room) {
      room.participants.delete(req.user.id);
      room.typing.delete(req.user.id);
    }

    broadcastToRoom(sessionId, {
      type: 'participant_left',
      userId: req.user.id,
      name: req.user.name,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('[Leave Session Error]', err);
    res.status(500).json({ error: 'Failed to leave session' });
  }
});

// ============================================================
// GET /:id/stream — SSE real-time event stream
// ============================================================
router.get('/:id/stream', (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);

    // Verify participant
    const participant = db.select().from(sessionParticipants)
      .where(and(eq(sessionParticipants.sessionId, sessionId), eq(sessionParticipants.userId, req.user.id)))
      .get();
    if (!participant) return res.status(403).json({ error: 'Not a participant' });

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const room = getOrCreateRoom(sessionId);

    // Add/update participant in room
    if (!room.participants.has(req.user.id)) {
      room.participants.set(req.user.id, {
        name: req.user.name,
        color: participant.color,
        currentPage: 1,
        cursorX: 0,
        cursorY: 0,
        lastActivity: Date.now(),
        sseRes: new Set([res]),
      });
    } else {
      room.participants.get(req.user.id).sseRes.add(res);
    }

    // Send init event with current state
    const participantsList = [];
    for (const [uid, p] of room.participants) {
      participantsList.push({
        userId: uid,
        name: p.name,
        color: p.color,
        currentPage: p.currentPage,
        cursorX: p.cursorX,
        cursorY: p.cursorY,
      });
    }

    const existingAnnotations = db.select({
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

    const recentMessages = db.select({
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

    res.write(`data: ${JSON.stringify({
      type: 'init',
      participants: participantsList,
      annotations: existingAnnotations.map(a => ({ ...a, data: JSON.parse(a.data) })),
      messages: recentMessages,
    })}\n\n`);

    // Broadcast join to others
    broadcastToRoom(sessionId, {
      type: 'participant_joined',
      userId: req.user.id,
      name: req.user.name,
      color: participant.color,
      currentPage: 1,
    }, req.user.id);

    // Heartbeat
    const heartbeat = setInterval(() => {
      try { res.write(': heartbeat\n\n'); } catch { clearInterval(heartbeat); }
    }, 15000);

    req.on('close', () => {
      clearInterval(heartbeat);
      const p = room.participants.get(req.user.id);
      if (p) {
        p.sseRes.delete(res);
        if (p.sseRes.size === 0) {
          room.participants.delete(req.user.id);
          room.typing.delete(req.user.id);
          broadcastToRoom(sessionId, {
            type: 'participant_left',
            userId: req.user.id,
            name: req.user.name,
          });
        }
      }
      if (room.participants.size === 0) {
        activeRooms.delete(sessionId);
      }
    });
  } catch (err) {
    console.error('[SSE Stream Error]', err);
    res.status(500).json({ error: 'Failed to connect' });
  }
});

// ============================================================
// POST /:id/presence — Update cursor + current page
// ============================================================
router.post('/:id/presence', (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const { currentPage, cursorX, cursorY } = req.body;
    
    if (!req.user) {
      console.error('[Presence Error] No user in request');
      return res.status(401).json({ error: 'User not found' });
    }

    const room = activeRooms.get(sessionId);
    if (!room) return res.json({ ok: true });

  // Verify participant
  const p = room.participants.get(req.user.id);
  if (!p) {
    // If not in memory but valid participant in DB, we should probably let them through
    // or return 403. Better to be strict.
    const exists = db.select().from(sessionParticipants)
      .where(and(eq(sessionParticipants.sessionId, sessionId), eq(sessionParticipants.userId, req.user.id)))
      .get();
    if (!exists) return res.status(403).json({ error: 'Not a participant' });
    return res.json({ ok: true }); // Just ignore if not active in stream yet
  }
  if (p) {
    if (currentPage !== undefined) p.currentPage = currentPage;
    if (cursorX !== undefined) p.cursorX = cursorX;
    if (cursorY !== undefined) p.cursorY = cursorY;
    p.lastActivity = Date.now();
  }

  broadcastToRoom(sessionId, {
    type: 'presence_update',
    userId: req.user.id,
    name: req.user.name,
    currentPage: p?.currentPage,
    cursorX: p?.cursorX,
    cursorY: p?.cursorY,
  }, req.user.id);

    res.json({ ok: true });
  } catch (err) {
    console.error('[Presence Error]', err);
    res.status(500).json({ error: 'Failed to update presence', details: err.message });
  }
});

// ============================================================
// POST /:id/annotations — Create annotation
// ============================================================
router.post('/:id/annotations', (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const { pageNumber, type, data, color } = req.body;

    if (!pageNumber || !type || !data) {
      return res.status(400).json({ error: 'pageNumber, type, and data are required' });
    }

    const annotation = db.insert(annotations).values({
      sessionId,
      userId: req.user.id,
      pageNumber,
      type,
      data: JSON.stringify(data),
      color: color || '#3B82F6',
    }).returning().get();

    const result = { ...annotation, data, userName: req.user.name };
    broadcastToRoom(sessionId, { type: 'annotation_created', annotation: result });
    res.json({ annotation: result });
  } catch (err) {
    console.error('[Create Annotation Error]', err);
    res.status(500).json({ error: 'Failed to create annotation' });
  }
});

// ============================================================
// PUT /:id/annotations/:aid — Update annotation
// ============================================================
router.put('/:id/annotations/:aid', (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const annotationId = parseInt(req.params.aid);
    const { data, resolved } = req.body;

    const updates = { 
      updatedAt: new Date().toISOString(),
      ...(data !== undefined && { data: JSON.stringify(data) }),
      ...(resolved !== undefined && { resolved })
    };

    db.update(annotations).set(updates).where(eq(annotations.id, annotationId)).run();

    const updated = db.select().from(annotations).where(eq(annotations.id, annotationId)).get();
    const result = { ...updated, data: JSON.parse(updated.data), userName: req.user.name };
    broadcastToRoom(sessionId, { type: 'annotation_updated', annotation: result });
    res.json({ annotation: result });
  } catch (err) {
    console.error('[Update Annotation Error]', err);
    res.status(500).json({ error: 'Failed to update annotation' });
  }
});

router.delete('/:id/annotations/:aid', (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const annotationId = parseInt(req.params.aid);

    if (!req.user) {
      console.error('[Delete Annotation Error] No user in request');
      return res.status(401).json({ error: 'User not found' });
    }

    if (isNaN(sessionId) || isNaN(annotationId)) {
      return res.status(400).json({ error: 'Invalid session or annotation ID' });
    }

    db.delete(annotations).where(and(eq(annotations.id, annotationId), eq(annotations.sessionId, sessionId))).run();
    broadcastToRoom(sessionId, { type: 'annotation_deleted', annotationId });
    res.json({ ok: true });
  } catch (err) {
    console.error('[Delete Annotation Error]', err);
    res.status(500).json({ error: 'Failed to delete annotation', details: err.message });
  }
});

// ============================================================
// GET /:id/annotations — Get all annotations
// ============================================================
router.get('/:id/annotations', (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const result = db.select({
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

    res.json({ annotations: result.map(a => ({ ...a, data: JSON.parse(a.data) })) });
  } catch (err) {
    console.error('[Get Annotations Error]', err);
    res.status(500).json({ error: 'Failed to get annotations' });
  }
});

// ============================================================
// POST /:id/messages — Send chat message
// ============================================================
router.post('/:id/messages', (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const { content, annotationId } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Message content is required' });

    const message = db.insert(sessionMessages).values({
      sessionId,
      userId: req.user.id,
      content: content.trim(),
      annotationId: annotationId || null,
    }).returning().get();

    const result = { ...message, userName: req.user.name };
    broadcastToRoom(sessionId, { type: 'message_created', message: result });

    // Clear typing
    const room = activeRooms.get(sessionId);
    if (room) room.typing.delete(req.user.id);

    res.json({ message: result });
  } catch (err) {
    console.error('[Send Message Error]', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ============================================================
// GET /:id/messages — Get chat history
// ============================================================
router.get('/:id/messages', (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const result = db.select({
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

    res.json({ messages: result });
  } catch (err) {
    console.error('[Get Messages Error]', err);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// ============================================================
// POST /:id/typing — Typing indicator
// ============================================================
router.post('/:id/typing', (req, res) => {
  const sessionId = parseInt(req.params.id);
  const { isTyping } = req.body;
  const room = activeRooms.get(sessionId);
  if (!room) return res.json({ ok: true });

  if (isTyping) {
    room.typing.add(req.user.id);
    broadcastToRoom(sessionId, {
      type: 'typing_start',
      userId: req.user.id,
      name: req.user.name,
    }, req.user.id);
  } else {
    room.typing.delete(req.user.id);
    broadcastToRoom(sessionId, {
      type: 'typing_stop',
      userId: req.user.id,
    }, req.user.id);
  }

  res.json({ ok: true });
});

module.exports = router;
