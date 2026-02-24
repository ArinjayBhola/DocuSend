const express = require('express');
const { eq, sql, desc, isNotNull, and } = require('drizzle-orm');
const { db } = require('../config/db');
const { documents, documentViews } = require('../db/schema');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Get all captured leads for user
router.get('/', requireAuth, (req, res) => {
  const leads = db.select({
    email: documentViews.viewerEmail,
    documentTitle: documents.title,
    documentId: documents.id,
    shareSlug: documents.shareSlug,
    viewCount: sql`count(*)`.as('view_count'),
    totalDuration: sql`coalesce(sum(${documentViews.duration}), 0)`.as('total_duration'),
    firstViewedAt: sql`min(${documentViews.viewedAt})`.as('first_viewed_at'),
    lastViewedAt: sql`max(${documentViews.viewedAt})`.as('last_viewed_at'),
    avgPagesViewed: sql`round(avg(${documentViews.pagesViewed}), 1)`.as('avg_pages_viewed'),
  })
    .from(documentViews)
    .innerJoin(documents, eq(documentViews.documentId, documents.id))
    .where(and(
      eq(documents.userId, req.userId),
      isNotNull(documentViews.viewerEmail),
    ))
    .groupBy(documentViews.viewerEmail, documents.id)
    .orderBy(desc(sql`max(${documentViews.viewedAt})`))
    .all();

  // Aggregate unique leads
  const uniqueLeads = {};
  for (const lead of leads) {
    if (!uniqueLeads[lead.email]) {
      uniqueLeads[lead.email] = {
        email: lead.email,
        totalViews: 0,
        totalDuration: 0,
        documents: [],
        firstSeen: lead.firstViewedAt,
        lastSeen: lead.lastViewedAt,
      };
    }
    const entry = uniqueLeads[lead.email];
    entry.totalViews += lead.viewCount;
    entry.totalDuration += lead.totalDuration;
    entry.documents.push({
      id: lead.documentId,
      title: lead.documentTitle,
      shareSlug: lead.shareSlug,
      viewCount: lead.viewCount,
      avgPagesViewed: lead.avgPagesViewed,
      lastViewedAt: lead.lastViewedAt,
    });
    if (lead.firstViewedAt < entry.firstSeen) entry.firstSeen = lead.firstViewedAt;
    if (lead.lastViewedAt > entry.lastSeen) entry.lastSeen = lead.lastViewedAt;
  }

  const result = Object.values(uniqueLeads);

  res.json({
    leads: result,
    totalLeads: result.length,
    totalViews: leads.reduce((sum, l) => sum + l.viewCount, 0),
  });
});

// Export leads as CSV
router.get('/export', requireAuth, (req, res) => {
  const leads = db.select({
    email: documentViews.viewerEmail,
    documentTitle: documents.title,
    viewCount: sql`count(*)`.as('view_count'),
    totalDuration: sql`coalesce(sum(${documentViews.duration}), 0)`.as('total_duration'),
    firstViewedAt: sql`min(${documentViews.viewedAt})`.as('first_viewed_at'),
    lastViewedAt: sql`max(${documentViews.viewedAt})`.as('last_viewed_at'),
  })
    .from(documentViews)
    .innerJoin(documents, eq(documentViews.documentId, documents.id))
    .where(and(
      eq(documents.userId, req.userId),
      isNotNull(documentViews.viewerEmail),
    ))
    .groupBy(documentViews.viewerEmail, documents.id)
    .orderBy(desc(sql`max(${documentViews.viewedAt})`))
    .all();

  const header = 'Email,Document,Views,Total Duration (s),First Viewed,Last Viewed\n';
  const rows = leads.map(l =>
    `"${l.email}","${l.documentTitle}",${l.viewCount},${l.totalDuration},"${l.firstViewedAt}","${l.lastViewedAt}"`
  ).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=docusend-leads.csv');
  res.send(header + rows);
});

module.exports = router;
