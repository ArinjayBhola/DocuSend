const express = require('express');
const { eq, desc, and, sql } = require('drizzle-orm');
const { db } = require('../config/db');
const { notifications, notificationPreferences } = require('../db/schema');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Get all notifications for user
router.get('/', requireAuth, (req, res) => {
  const items = db.select()
    .from(notifications)
    .where(eq(notifications.userId, req.userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50)
    .all();

  const unreadCount = db.select({
    count: sql`count(*)`,
  }).from(notifications)
    .where(and(eq(notifications.userId, req.userId), eq(notifications.isRead, false)))
    .get();

  res.json({ notifications: items, unreadCount: unreadCount?.count || 0 });
});

// Get unread count only (lightweight poll)
router.get('/unread-count', requireAuth, (req, res) => {
  const result = db.select({
    count: sql`count(*)`,
  }).from(notifications)
    .where(and(eq(notifications.userId, req.userId), eq(notifications.isRead, false)))
    .get();

  res.json({ unreadCount: result?.count || 0 });
});

// Mark notification as read
router.post('/:id/read', requireAuth, (req, res) => {
  db.update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, parseInt(req.params.id)), eq(notifications.userId, req.userId)))
    .run();

  res.json({ ok: true });
});

// Mark all as read
router.post('/read-all', requireAuth, (req, res) => {
  db.update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, req.userId), eq(notifications.isRead, false)))
    .run();

  res.json({ ok: true });
});

// Get notification preferences
router.get('/preferences', requireAuth, (req, res) => {
  let prefs = db.select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, req.userId))
    .get();

  if (!prefs) {
    db.insert(notificationPreferences).values({ userId: req.userId }).run();
    prefs = db.select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, req.userId))
      .get();
  }

  res.json({ preferences: prefs });
});

// Update notification preferences
router.put('/preferences', requireAuth, (req, res) => {
  const { emailOnView, emailOnEmailCapture, inAppNotifications } = req.body;

  let prefs = db.select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, req.userId))
    .get();

  if (!prefs) {
    db.insert(notificationPreferences).values({ userId: req.userId }).run();
  }

  const updates = {};
  if (typeof emailOnView === 'boolean') updates.emailOnView = emailOnView;
  if (typeof emailOnEmailCapture === 'boolean') updates.emailOnEmailCapture = emailOnEmailCapture;
  if (typeof inAppNotifications === 'boolean') updates.inAppNotifications = inAppNotifications;

  db.update(notificationPreferences)
    .set(updates)
    .where(eq(notificationPreferences.userId, req.userId))
    .run();

  const updated = db.select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, req.userId))
    .get();

  res.json({ preferences: updated });
});

module.exports = router;
