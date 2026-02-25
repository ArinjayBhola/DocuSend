const express = require("express");
const { eq, and, desc, sql } = require("drizzle-orm");
const { db } = require("../config/db");
const { documents, documentViews, pageEvents } = require("../db/schema");
const { requireAuth, loadUser } = require("../middleware/auth");

const router = express.Router();

router.get("/:id/analytics", requireAuth, loadUser, (req, res) => {
  const doc = db
    .select()
    .from(documents)
    .where(and(eq(documents.id, parseInt(req.params.id)), eq(documents.userId, req.user.id)))
    .get();

  if (!doc) return res.status(404).json({ error: "Document not found" });

  const stats = db
    .select({
      totalViews: sql`count(*)`,
      uniqueViewers: sql`count(distinct coalesce(viewer_email, viewer_ip))`,
      avgDuration: sql`coalesce(avg(duration), 0)`,
      totalDuration: sql`coalesce(sum(duration), 0)`,
    })
    .from(documentViews)
    .where(eq(documentViews.documentId, doc.id))
    .get();

  const viewers = db
    .select()
    .from(documentViews)
    .where(eq(documentViews.documentId, doc.id))
    .orderBy(desc(documentViews.viewedAt))
    .limit(50)
    .all();

  const pageHeatmap = db
    .select({
      pageNumber: pageEvents.pageNumber,
      totalTime: sql`sum(time_spent)`,
      viewCount: sql`count(*)`,
    })
    .from(pageEvents)
    .innerJoin(documentViews, eq(pageEvents.viewId, documentViews.id))
    .where(eq(documentViews.documentId, doc.id))
    .groupBy(pageEvents.pageNumber)
    .orderBy(pageEvents.pageNumber)
    .all();

  const viewTimeline = db
    .select({
      date: sql`date(viewed_at)`,
      count: sql`count(*)`,
    })
    .from(documentViews)
    .where(eq(documentViews.documentId, doc.id))
    .groupBy(sql`date(viewed_at)`)
    .orderBy(sql`date(viewed_at)`)
    .all();

  res.json({ document: doc, stats, viewers, pageHeatmap, viewTimeline });
});

module.exports = router;
