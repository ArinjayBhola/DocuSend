const express = require('express');
const { eq, sql, desc, and, gte } = require('drizzle-orm');
const { db } = require('../config/db');
const { documents, documentViews, pageEvents, users } = require('../db/schema');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ============================================================
// IN-MEMORY ACTIVE SESSION STORE
// ============================================================
// Map<viewId, { documentId, userId (doc owner), viewerEmail, viewerIp, currentPage, totalPages, startedAt, lastActivity, pagesVisited: Set }>
const activeSessions = new Map();

// Map<userId, Set<SSE response objects>> for real-time push
const sseClients = new Map();

// Clean up stale sessions (no activity for 5 minutes)
setInterval(() => {
  const cutoff = Date.now() - 5 * 60 * 1000;
  for (const [viewId, session] of activeSessions) {
    if (session.lastActivity < cutoff) {
      activeSessions.delete(viewId);
      broadcastToUser(session.userId, {
        type: 'session_ended',
        viewId,
        viewerEmail: session.viewerEmail,
        documentTitle: session.documentTitle,
      });
    }
  }
}, 30000);

function broadcastToUser(userId, data) {
  const clients = sseClients.get(userId);
  if (!clients) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    try { res.write(payload); } catch { /* ignore dead connections */ }
  }
}

// ============================================================
// PUBLIC: Called by share viewer to register/update active sessions
// ============================================================
router.post('/sessions/start', (req, res) => {
  const { viewId, documentId, viewerEmail, totalPages } = req.body;
  if (!viewId || !documentId) return res.status(400).json({ error: 'Missing viewId or documentId' });

  // Find doc owner
  const doc = db.select({ userId: documents.userId, title: documents.title })
    .from(documents).where(eq(documents.id, documentId)).get();
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  const session = {
    viewId,
    documentId,
    documentTitle: doc.title,
    userId: doc.userId,
    viewerEmail: viewerEmail || null,
    viewerIp: req.ip || req.headers['x-forwarded-for'] || 'unknown',
    currentPage: 1,
    totalPages: totalPages || 0,
    startedAt: Date.now(),
    lastActivity: Date.now(),
    pagesVisited: new Set([1]),
    timeOnCurrentPage: 0,
  };

  activeSessions.set(viewId, session);

  // Broadcast to doc owner
  broadcastToUser(doc.userId, {
    type: 'session_started',
    viewId,
    documentId,
    documentTitle: doc.title,
    viewerEmail: session.viewerEmail,
    viewerIp: session.viewerIp,
    currentPage: 1,
    totalPages: session.totalPages,
    startedAt: session.startedAt,
  });

  res.json({ ok: true });
});

router.post('/sessions/page-change', (req, res) => {
  const { viewId, pageNumber, timeSpent } = req.body;
  const session = activeSessions.get(viewId);
  if (!session) return res.json({ ok: true });

  session.currentPage = pageNumber;
  session.lastActivity = Date.now();
  session.pagesVisited.add(pageNumber);
  session.timeOnCurrentPage = 0;

  broadcastToUser(session.userId, {
    type: 'page_changed',
    viewId,
    documentId: session.documentId,
    documentTitle: session.documentTitle,
    viewerEmail: session.viewerEmail,
    currentPage: pageNumber,
    totalPages: session.totalPages,
    pagesVisited: session.pagesVisited.size,
    elapsedSeconds: Math.round((Date.now() - session.startedAt) / 1000),
  });

  res.json({ ok: true });
});

router.post('/sessions/end', express.text({ type: '*/*' }), (req, res) => {
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.json({ ok: true }); }
  }
  const { viewId } = body;
  const session = activeSessions.get(viewId);
  if (session) {
    broadcastToUser(session.userId, {
      type: 'session_ended',
      viewId,
      documentId: session.documentId,
      documentTitle: session.documentTitle,
      viewerEmail: session.viewerEmail,
      duration: Math.round((Date.now() - session.startedAt) / 1000),
      pagesVisited: session.pagesVisited.size,
    });
    activeSessions.delete(viewId);
  }
  res.json({ ok: true });
});

// ============================================================
// PROTECTED: SSE endpoint for real-time live feed
// ============================================================
router.get('/stream', requireAuth, (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Send initial active sessions for this user
  const userSessions = [];
  for (const [viewId, session] of activeSessions) {
    if (session.userId === req.userId) {
      userSessions.push({
        viewId,
        documentId: session.documentId,
        documentTitle: session.documentTitle,
        viewerEmail: session.viewerEmail,
        viewerIp: session.viewerIp,
        currentPage: session.currentPage,
        totalPages: session.totalPages,
        pagesVisited: session.pagesVisited.size,
        startedAt: session.startedAt,
        elapsedSeconds: Math.round((Date.now() - session.startedAt) / 1000),
      });
    }
  }

  res.write(`data: ${JSON.stringify({ type: 'init', sessions: userSessions })}\n\n`);

  // Register client
  if (!sseClients.has(req.userId)) sseClients.set(req.userId, new Set());
  sseClients.get(req.userId).add(res);

  // Heartbeat
  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch { clearInterval(heartbeat); }
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    const clients = sseClients.get(req.userId);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) sseClients.delete(req.userId);
    }
  });
});

// ============================================================
// PROTECTED: Get engagement scores + document performance
// ============================================================
router.get('/engagement', requireAuth, (req, res) => {
  try {
    // Get all views from last 30 days for this user's documents
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const recentViews = db.select({
      viewId: documentViews.id,
      documentId: documentViews.documentId,
      documentTitle: documents.title,
      viewerEmail: documentViews.viewerEmail,
      viewerIp: documentViews.viewerIp,
      duration: documentViews.duration,
      pagesViewed: documentViews.pagesViewed,
      totalPages: documentViews.totalPages,
      viewedAt: documentViews.viewedAt,
    })
      .from(documentViews)
      .innerJoin(documents, eq(documentViews.documentId, documents.id))
      .where(and(
        eq(documents.userId, req.userId),
        gte(documentViews.viewedAt, thirtyDaysAgo)
      ))
      .orderBy(desc(documentViews.viewedAt))
      .all();

    // ---- ENGAGEMENT SCORING ALGORITHM ----
    // Score each unique viewer across all their views
    // Factors: total time, pages viewed %, return visits, recency
    const viewerScores = {};

    for (const view of recentViews) {
      const key = view.viewerEmail || view.viewerIp || 'unknown';
      if (!viewerScores[key]) {
        viewerScores[key] = {
          identifier: key,
          isEmail: !!view.viewerEmail,
          email: view.viewerEmail,
          visits: 0,
          totalDuration: 0,
          maxCompletionRate: 0,
          documents: new Set(),
          lastVisit: view.viewedAt,
          firstVisit: view.viewedAt,
          score: 0,
          tier: 'cold', // cold, warm, hot
        };
      }

      const scorer = viewerScores[key];
      scorer.visits += 1;
      scorer.totalDuration += Number(view.duration) || 0;
      scorer.documents.add(view.documentId);

      const completion = view.totalPages > 0
        ? (Number(view.pagesViewed) || 0) / Number(view.totalPages)
        : 0;
      scorer.maxCompletionRate = Math.max(scorer.maxCompletionRate, completion);

      if (view.viewedAt > scorer.lastVisit) scorer.lastVisit = view.viewedAt;
      if (view.viewedAt < scorer.firstVisit) scorer.firstVisit = view.viewedAt;
    }

    // Calculate final scores (0-100)
    for (const scorer of Object.values(viewerScores)) {
      // Time score: 0-25 points (more time = higher score, cap at 10 min)
      const timeScore = Math.min(25, (scorer.totalDuration / 600) * 25);

      // Completion score: 0-25 points (read more pages = higher)
      const completionScore = scorer.maxCompletionRate * 25;

      // Return visit score: 0-25 points (more visits = higher, cap at 5)
      const visitScore = Math.min(25, (scorer.visits / 5) * 25);

      // Recency score: 0-25 points (more recent = higher)
      const daysSinceLastVisit = (Date.now() - new Date(scorer.lastVisit).getTime()) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.max(0, 25 - (daysSinceLastVisit / 30) * 25);

      scorer.score = Math.round(timeScore + completionScore + visitScore + recencyScore);
      scorer.tier = scorer.score >= 70 ? 'hot' : scorer.score >= 40 ? 'warm' : 'cold';
      scorer.documentsCount = scorer.documents.size;
      delete scorer.documents; // Don't send Set to client
    }

    const scoredViewers = Object.values(viewerScores)
      .sort((a, b) => b.score - a.score);

    // ---- DOCUMENT PERFORMANCE ----
    const docPerformance = {};
    for (const view of recentViews) {
      if (!docPerformance[view.documentId]) {
        docPerformance[view.documentId] = {
          documentId: view.documentId,
          title: view.documentTitle,
          totalViews: 0,
          uniqueViewers: new Set(),
          totalDuration: 0,
          avgCompletion: 0,
          completionSum: 0,
        };
      }
      const perf = docPerformance[view.documentId];
      perf.totalViews += 1;
      perf.uniqueViewers.add(view.viewerEmail || view.viewerIp);
      perf.totalDuration += Number(view.duration) || 0;
      const completion = view.totalPages > 0 ? (Number(view.pagesViewed) || 0) / Number(view.totalPages) : 0;
      perf.completionSum += completion;
    }

    const docRankings = Object.values(docPerformance).map(d => ({
      documentId: d.documentId,
      title: d.title,
      totalViews: d.totalViews,
      uniqueViewers: d.uniqueViewers.size,
      avgDuration: d.totalViews > 0 ? Math.round(d.totalDuration / d.totalViews) : 0,
      avgCompletion: d.totalViews > 0 ? Math.round((d.completionSum / d.totalViews) * 100) : 0,
      engagementScore: Math.round(
        (d.totalViews * 2) +
        (d.uniqueViewers.size * 10) +
        (d.totalDuration / 60) +
        ((d.completionSum / Math.max(d.totalViews, 1)) * 50)
      ),
    })).sort((a, b) => b.engagementScore - a.engagementScore);

    // ---- SUMMARY STATS ----
    const hotLeads = scoredViewers.filter(v => v.tier === 'hot').length;
    const warmLeads = scoredViewers.filter(v => v.tier === 'warm').length;
    const coldLeads = scoredViewers.filter(v => v.tier === 'cold').length;

    // Active sessions count for this user
    let activeCount = 0;
    for (const session of activeSessions.values()) {
      if (session.userId === req.userId) activeCount++;
    }

    res.json({
      summary: {
        totalViewers: scoredViewers.length,
        hotLeads,
        warmLeads,
        coldLeads,
        activeSessions: activeCount,
        totalViews30d: recentViews.length,
      },
      viewers: scoredViewers.slice(0, 50),
      documentRankings: docRankings.slice(0, 20),
    });
  } catch (err) {
    console.error('[Engagement Error]', err);
    res.status(500).json({ error: 'Failed to calculate engagement' });
  }
});

module.exports = router;
