const express = require('express');
const { eq, desc, sql } = require('drizzle-orm');
const { db } = require('../config/db');
const { documents, documentViews } = require('../db/schema');
const { requireAuth, loadUser } = require('../middleware/auth');
const { getPlanLimits } = require('../utils/helpers');

const router = express.Router();

router.get('/', requireAuth, loadUser, (req, res) => {
  const userDocs = db.select().from(documents)
    .where(eq(documents.userId, req.user.id))
    .orderBy(desc(documents.createdAt))
    .all();

  const docsWithStats = userDocs.map(doc => {
    const viewStats = db.select({
      viewCount: sql`count(*)`,
      totalDuration: sql`coalesce(sum(duration), 0)`,
    }).from(documentViews)
      .where(eq(documentViews.documentId, doc.id))
      .get();

    const lastView = db.select({ viewedAt: documentViews.viewedAt })
      .from(documentViews)
      .where(eq(documentViews.documentId, doc.id))
      .orderBy(desc(documentViews.viewedAt))
      .limit(1)
      .get();

    return {
      ...doc,
      viewCount: viewStats?.viewCount || 0,
      totalDuration: viewStats?.totalDuration || 0,
      lastViewedAt: lastView?.viewedAt,
    };
  });

  const limits = getPlanLimits(req.user.plan);

  res.json({
    docs: docsWithStats,
    docCount: userDocs.length,
    limits,
  });
});

module.exports = router;
