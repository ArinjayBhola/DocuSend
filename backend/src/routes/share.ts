const express = require('express');
const path = require('path');
const { eq, sql } = require('drizzle-orm');
const { db } = require('../config/db');
const { documents, documentViews, pageEvents, notifications, notificationPreferences, users } = require('../db/schema');

const { sendViewNotification } = require('../services/email');

const router = express.Router();

// Helper: create notification + send email for a document view
function notifyDocumentView({ documentId, viewerEmail, viewerIp }) {
  try {
    const doc = db.select({
      id: documents.id,
      title: documents.title,
      userId: documents.userId,
    }).from(documents).where(eq(documents.id, documentId)).get();

    if (!doc) return;

    const owner = db.select().from(users).where(eq(users.id, doc.userId)).get();
    if (!owner) return;

    // Check notification preferences
    const prefs = db.select().from(notificationPreferences)
      .where(eq(notificationPreferences.userId, doc.userId)).get();

    const shouldNotifyInApp = !prefs || prefs.inAppNotifications;
    const shouldNotifyEmail = !prefs || prefs.emailOnView;

    if (shouldNotifyInApp) {
      const viewer = viewerEmail || viewerIp || 'Someone';
      db.insert(notifications).values({
        userId: doc.userId,
        documentId: doc.id,
        type: 'view',
        title: `New view on "${doc.title}"`,
        message: `${viewer} started viewing your document.`,
        viewerEmail: viewerEmail || null,
        viewerIp: viewerIp || null,
      }).run();
    }

    if (shouldNotifyEmail) {
      sendViewNotification({
        ownerEmail: owner.email,
        documentTitle: doc.title,
        viewerEmail,
        viewerIp,
      }).catch(() => {}); // fire and forget
    }
  } catch (err) {
    console.error('[Notification Error]', err);
  }
}

// Helper: notify on email capture
function notifyEmailCapture({ documentId, email }) {
  try {
    const doc = db.select({
      id: documents.id,
      title: documents.title,
      userId: documents.userId,
    }).from(documents).where(eq(documents.id, documentId)).get();

    if (!doc) return;

    const prefs = db.select().from(notificationPreferences)
      .where(eq(notificationPreferences.userId, doc.userId)).get();

    const shouldNotify = !prefs || prefs.emailOnEmailCapture;

    if (shouldNotify) {
      db.insert(notifications).values({
        userId: doc.userId,
        documentId: doc.id,
        type: 'email_captured',
        title: `New lead captured!`,
        message: `${email} shared their email to view "${doc.title}".`,
        viewerEmail: email,
      }).run();
    }
  } catch (err) {
    console.error('[Notification Error]', err);
  }
}

// Get share document metadata
router.get('/:slug', (req, res) => {
  const doc = db.select({
    id: documents.id,
    title: documents.title,
    fileName: documents.fileName,
    shareSlug: documents.shareSlug,
    isActive: documents.isActive,
    password: documents.password,
    requireEmail: documents.requireEmail,
    expiresAt: documents.expiresAt,
    allowDownload: documents.allowDownload,
  }).from(documents).where(eq(documents.shareSlug, req.params.slug)).get();

  if (!doc || !doc.isActive) {
    return res.status(404).json({ error: 'Document not found' });
  }

  if (doc.expiresAt && new Date(doc.expiresAt) < new Date()) {
    return res.status(410).json({ error: 'Document has expired' });
  }

  res.json({
    document: {
      id: doc.id,
      title: doc.title,
      fileName: doc.fileName,
      shareSlug: doc.shareSlug,
      allowDownload: doc.allowDownload,
      requiresPassword: !!doc.password,
      requiresEmail: !!doc.requireEmail,
    },
  });
});

// Verify password
router.post('/:slug/verify-password', (req, res) => {
  const doc = db.select().from(documents).where(eq(documents.shareSlug, req.params.slug)).get();
  if (!doc) return res.status(404).json({ error: 'Not found' });

  if (req.body.password === doc.password) {
    return res.json({ ok: true });
  }

  res.status(401).json({ error: 'Incorrect password' });
});

// Submit email
router.post('/:slug/submit-email', (req, res) => {
  const { email } = req.body;
  const doc = db.select().from(documents).where(eq(documents.shareSlug, req.params.slug)).get();
  if (!doc) return res.status(404).json({ error: 'Not found' });

  // Notify about lead capture
  if (email) {
    notifyEmailCapture({ documentId: doc.id, email });
  }

  res.json({ ok: true });
});

// Start a view session
router.post('/views/start', (req, res) => {
  const { documentId, viewerEmail, totalPages } = req.body;

  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';

  const result = db.insert(documentViews).values({
    documentId,
    viewerEmail: viewerEmail || null,
    viewerIp: ip,
    userAgent: req.headers['user-agent'] || '',
    totalPages: totalPages || 0,
    referrer: req.headers['referer'] || '',
  }).run();

  // Fire notification
  notifyDocumentView({ documentId, viewerEmail, viewerIp: ip });

  res.json({ viewId: Number(result.lastInsertRowid) });
});

// Track page event
router.post('/views/page', (req, res) => {
  const { viewId, pageNumber, timeSpent } = req.body;
  if (!viewId || !pageNumber) return res.status(400).json({ error: 'Missing fields' });

  db.insert(pageEvents).values({
    viewId,
    pageNumber,
    timeSpent: timeSpent || 0,
  }).run();

  const events = db.select({
    uniquePages: sql`count(distinct page_number)`,
    totalTime: sql`coalesce(sum(time_spent), 0)`,
  }).from(pageEvents).where(eq(pageEvents.viewId, viewId)).get();

  db.update(documentViews).set({
    pagesViewed: events.uniquePages,
    duration: Math.round((events.totalTime || 0) / 1000),
  }).where(eq(documentViews.id, viewId)).run();

  res.json({ ok: true });
});

// End view session (beacon)
router.post('/views/end', express.text({ type: '*/*' }), (req, res) => {
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.json({ ok: true }); }
  }
  const { viewId, pageNumber, timeSpent } = body;
  if (viewId && pageNumber && timeSpent) {
    db.insert(pageEvents).values({ viewId, pageNumber, timeSpent }).run();

    const events = db.select({
      uniquePages: sql`count(distinct page_number)`,
      totalTime: sql`coalesce(sum(time_spent), 0)`,
    }).from(pageEvents).where(eq(pageEvents.viewId, viewId)).get();

    db.update(documentViews).set({
      pagesViewed: events.uniquePages,
      duration: Math.round((events.totalTime || 0) / 1000),
    }).where(eq(documentViews.id, viewId)).run();
  }
  res.json({ ok: true });
});

// Serve PDF file
router.get('/pdf/:slug', (req, res) => {
  const doc = db.select().from(documents).where(eq(documents.shareSlug, req.params.slug)).get();
  if (!doc || !doc.isActive) return res.status(404).json({ error: 'Not found' });

  const filePath = path.join(__dirname, '..', '..', 'uploads', doc.filePath);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline');
  res.sendFile(filePath);
});

module.exports = router;
