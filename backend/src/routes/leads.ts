const express = require("express");
const { eq, sql, desc, isNotNull, and } = require("drizzle-orm");
const { db } = require("../config/db");
const { documents, documentViews } = require("../db/schema");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// CSV escape helper
function escapeCSV(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

// Get all captured leads for user
router.get("/", requireAuth, (req, res) => {
  try {
    const leads = db
      .select({
        email: documentViews.viewerEmail,
        documentTitle: documents.title,
        documentId: documents.id,
        shareSlug: documents.shareSlug,
        viewCount: sql`cast(count(*) as integer)`.as("view_count"),
        totalDuration: sql`cast(coalesce(sum(${documentViews.duration}), 0) as integer)`.as("total_duration"),
        firstViewedAt: sql`min(${documentViews.viewedAt})`.as("first_viewed_at"),
        lastViewedAt: sql`max(${documentViews.viewedAt})`.as("last_viewed_at"),
        avgPagesViewed: sql`round(avg(${documentViews.pagesViewed}), 1)`.as("avg_pages_viewed"),
      })
      .from(documentViews)
      .innerJoin(documents, eq(documentViews.documentId, documents.id))
      .where(
        and(
          eq(documents.userId, req.userId),
          isNotNull(documentViews.viewerEmail),
          sql`${documentViews.viewerEmail} != ''`,
        ),
      )
      .groupBy(documentViews.viewerEmail, documents.id)
      .orderBy(desc(sql`max(${documentViews.viewedAt})`))
      .all();

    // Aggregate unique leads across documents
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
      entry.totalViews += Number(lead.viewCount) || 0;
      entry.totalDuration += Number(lead.totalDuration) || 0;
      entry.documents.push({
        id: lead.documentId,
        title: lead.documentTitle,
        shareSlug: lead.shareSlug,
        viewCount: Number(lead.viewCount) || 0,
        avgPagesViewed: Number(lead.avgPagesViewed) || 0,
        lastViewedAt: lead.lastViewedAt,
      });
      if (lead.firstViewedAt < entry.firstSeen) entry.firstSeen = lead.firstViewedAt;
      if (lead.lastViewedAt > entry.lastSeen) entry.lastSeen = lead.lastViewedAt;
    }

    const result = Object.values(uniqueLeads);

    res.json({
      leads: result,
      totalLeads: result.length,
      totalViews: result.reduce((sum, l) => sum + l.totalViews, 0),
    });
  } catch (err) {
    console.error("[Leads Error]", err);
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

// Export leads as CSV
router.get("/export", requireAuth, (req, res) => {
  try {
    const leads = db
      .select({
        email: documentViews.viewerEmail,
        documentTitle: documents.title,
        viewCount: sql`cast(count(*) as integer)`.as("view_count"),
        totalDuration: sql`cast(coalesce(sum(${documentViews.duration}), 0) as integer)`.as("total_duration"),
        firstViewedAt: sql`min(${documentViews.viewedAt})`.as("first_viewed_at"),
        lastViewedAt: sql`max(${documentViews.viewedAt})`.as("last_viewed_at"),
      })
      .from(documentViews)
      .innerJoin(documents, eq(documentViews.documentId, documents.id))
      .where(
        and(
          eq(documents.userId, req.userId),
          isNotNull(documentViews.viewerEmail),
          sql`${documentViews.viewerEmail} != ''`,
        ),
      )
      .groupBy(documentViews.viewerEmail, documents.id)
      .orderBy(desc(sql`max(${documentViews.viewedAt})`))
      .all();

    const header = "Email,Document,Views,Total Duration (s),First Viewed,Last Viewed\n";
    const rows = leads
      .map(
        (l) =>
          `${escapeCSV(l.email)},${escapeCSV(l.documentTitle)},${Number(l.viewCount) || 0},${Number(l.totalDuration) || 0},${escapeCSV(l.firstViewedAt)},${escapeCSV(l.lastViewedAt)}`,
      )
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=docusend-leads.csv");
    res.send(header + rows);
  } catch (err) {
    console.error("[Leads Export Error]", err);
    res.status(500).json({ error: "Failed to export leads" });
  }
});

module.exports = router;
