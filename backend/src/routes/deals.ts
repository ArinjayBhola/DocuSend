const express = require("express");
const { eq, sql, desc, and, gte, inArray } = require("drizzle-orm");
const { db } = require("../config/db");
const {
  deals,
  stakeholders,
  dealActivities,
  documents,
  documentViews,
  workspaces,
  workspaceDocuments,
} = require("../db/schema");
const { requireAuth, loadUser } = require("../middleware/auth");
const { checkDealLimit } = require("../middleware/planLimits");

const router = express.Router();

// All routes require auth + user loaded
router.use(requireAuth);
router.use(loadUser);

// ============================================================
// HELPERS
// ============================================================

function getWorkspaceDocs(workspaceId, userId) {
  return db
    .select({
      documentId: workspaceDocuments.documentId,
      title: documents.title,
    })
    .from(workspaceDocuments)
    .innerJoin(documents, eq(workspaceDocuments.documentId, documents.id))
    .where(and(eq(workspaceDocuments.workspaceId, workspaceId), eq(documents.userId, userId)))
    .all();
}

function getViewsForDocuments(docIds) {
  if (!docIds.length) return [];
  return db
    .select({
      id: documentViews.id,
      documentId: documentViews.documentId,
      viewerEmail: documentViews.viewerEmail,
      duration: documentViews.duration,
      pagesViewed: documentViews.pagesViewed,
      totalPages: documentViews.totalPages,
      viewedAt: documentViews.viewedAt,
      documentTitle: documents.title,
    })
    .from(documentViews)
    .innerJoin(documents, eq(documentViews.documentId, documents.id))
    .where(inArray(documentViews.documentId, docIds))
    .orderBy(desc(documentViews.viewedAt))
    .all();
}

function computeEngagementScore(views) {
  if (!views.length) return 0;
  let totalDuration = 0;
  let maxCompletion = 0;
  let visitCount = views.length;
  let lastVisit = views[0].viewedAt;

  for (const v of views) {
    totalDuration += Number(v.duration) || 0;
    const completion = v.totalPages > 0 ? (Number(v.pagesViewed) || 0) / Number(v.totalPages) : 0;
    maxCompletion = Math.max(maxCompletion, completion);
    if (v.viewedAt > lastVisit) lastVisit = v.viewedAt;
  }

  const timeScore = Math.min(25, (totalDuration / 600) * 25);
  const completionScore = maxCompletion * 25;
  const visitScore = Math.min(25, (visitCount / 5) * 25);
  const daysSinceLastVisit = (Date.now() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24);
  const recencyScore = Math.max(0, 25 - (daysSinceLastVisit / 30) * 25);

  return Math.round(timeScore + completionScore + visitScore + recencyScore);
}

function computeHealthStatus(riskScore) {
  if (riskScore >= 70) return "healthy";
  if (riskScore >= 40) return "at_risk";
  return "critical";
}

function addActivity(dealId, type, description, metadata = null) {
  db.insert(dealActivities)
    .values({
      dealId,
      type,
      description,
      metadata: metadata ? JSON.stringify(metadata) : null,
    })
    .run();
}

// ============================================================
// GET / — List all deals
// ============================================================
router.get("/", (req, res) => {
  try {
    const userDeals = db
      .select({
        id: deals.id,
        workspaceId: deals.workspaceId,
        accountName: deals.accountName,
        stage: deals.stage,
        value: deals.value,
        currency: deals.currency,
        closeDate: deals.closeDate,
        healthStatus: deals.healthStatus,
        createdAt: deals.createdAt,
        workspaceName: workspaces.name,
      })
      .from(deals)
      .innerJoin(workspaces, eq(deals.workspaceId, workspaces.id))
      .where(eq(deals.userId, req.userId))
      .orderBy(desc(deals.updatedAt))
      .all();

    // Attach stakeholder counts
    const result = userDeals.map((deal) => {
      const stakeholderCount = db
        .select({ count: sql`count(*)` })
        .from(stakeholders)
        .where(eq(stakeholders.dealId, deal.id))
        .get();
      return { ...deal, stakeholderCount: stakeholderCount.count };
    });

    res.json({ deals: result });
  } catch (err) {
    console.error("[Deals List Error]", err);
    res.status(500).json({ error: "Failed to load deals" });
  }
});

// ============================================================
// POST / — Create deal
// ============================================================
router.post("/", checkDealLimit, (req, res) => {
  try {
    const { workspaceId, accountName, stage, value, currency, closeDate } = req.body;
    if (!workspaceId || !accountName) {
      return res.status(400).json({ error: "Workspace and account name are required" });
    }

    // Verify workspace belongs to user
    const ws = db
      .select()
      .from(workspaces)
      .where(and(eq(workspaces.id, workspaceId), eq(workspaces.userId, req.userId)))
      .get();
    if (!ws) return res.status(404).json({ error: "Workspace not found" });

    // Check if workspace already has a deal
    const existing = db
      .select()
      .from(deals)
      .where(and(eq(deals.workspaceId, workspaceId), eq(deals.userId, req.userId)))
      .get();
    if (existing) return res.status(400).json({ error: "This workspace already has a deal linked" });

    const now = new Date().toISOString();
    const result = db
      .insert(deals)
      .values({
        userId: req.userId,
        workspaceId,
        accountName,
        stage: stage || "prospecting",
        value: value || 0,
        currency: currency || "USD",
        closeDate: closeDate || null,
        stageEnteredAt: now,
        healthStatus: "healthy",
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();

    addActivity(result.id, "stage_change", `Deal created in ${result.stage} stage`);

    res.status(201).json({ deal: result });
  } catch (err) {
    console.error("[Deal Create Error]", err);
    res.status(500).json({ error: "Failed to create deal" });
  }
});

// ============================================================
// GET /:id — Deal detail
// ============================================================
router.get("/:id", (req, res) => {
  try {
    const deal = db
      .select({
        id: deals.id,
        userId: deals.userId,
        workspaceId: deals.workspaceId,
        accountName: deals.accountName,
        stage: deals.stage,
        value: deals.value,
        currency: deals.currency,
        closeDate: deals.closeDate,
        stageEnteredAt: deals.stageEnteredAt,
        healthStatus: deals.healthStatus,
        createdAt: deals.createdAt,
        updatedAt: deals.updatedAt,
        workspaceName: workspaces.name,
      })
      .from(deals)
      .innerJoin(workspaces, eq(deals.workspaceId, workspaces.id))
      .where(and(eq(deals.id, Number(req.params.id)), eq(deals.userId, req.userId)))
      .get();

    if (!deal) return res.status(404).json({ error: "Deal not found" });

    const dealStakeholders = db.select().from(stakeholders).where(eq(stakeholders.dealId, deal.id)).all();

    // Get workspace docs and views for stats
    const wsDocs = getWorkspaceDocs(deal.workspaceId, req.userId);
    const docIds = wsDocs.map((d) => d.documentId);
    const views = getViewsForDocuments(docIds);

    const daysInStage = Math.floor((Date.now() - new Date(deal.stageEnteredAt).getTime()) / (1000 * 60 * 60 * 24));

    res.json({
      deal,
      stakeholders: dealStakeholders,
      stats: {
        totalDocuments: wsDocs.length,
        totalViews: views.length,
        totalDuration: views.reduce((sum, v) => sum + (Number(v.duration) || 0), 0),
        daysInStage,
      },
    });
  } catch (err) {
    console.error("[Deal Detail Error]", err);
    res.status(500).json({ error: "Failed to load deal" });
  }
});

// ============================================================
// PUT /:id — Update deal
// ============================================================
router.put("/:id", (req, res) => {
  try {
    const deal = db
      .select()
      .from(deals)
      .where(and(eq(deals.id, Number(req.params.id)), eq(deals.userId, req.userId)))
      .get();
    if (!deal) return res.status(404).json({ error: "Deal not found" });

    const { accountName, stage, value, currency, closeDate } = req.body;
    const now = new Date().toISOString();
    const updates = { updatedAt: now };

    if (accountName !== undefined) updates.accountName = accountName;
    if (value !== undefined) updates.value = value;
    if (currency !== undefined) updates.currency = currency;
    if (closeDate !== undefined) updates.closeDate = closeDate;

    if (stage && stage !== deal.stage) {
      updates.stage = stage;
      updates.stageEnteredAt = now;
      addActivity(deal.id, "stage_change", `Stage changed from ${deal.stage} to ${stage}`, {
        from: deal.stage,
        to: stage,
      });
    }

    db.update(deals).set(updates).where(eq(deals.id, deal.id)).run();

    const updated = db.select().from(deals).where(eq(deals.id, deal.id)).get();
    res.json({ deal: updated });
  } catch (err) {
    console.error("[Deal Update Error]", err);
    res.status(500).json({ error: "Failed to update deal" });
  }
});

// ============================================================
// DELETE /:id — Delete deal
// ============================================================
router.delete("/:id", (req, res) => {
  try {
    const deal = db
      .select()
      .from(deals)
      .where(and(eq(deals.id, Number(req.params.id)), eq(deals.userId, req.userId)))
      .get();
    if (!deal) return res.status(404).json({ error: "Deal not found" });

    db.delete(deals).where(eq(deals.id, deal.id)).run();
    res.json({ ok: true });
  } catch (err) {
    console.error("[Deal Delete Error]", err);
    res.status(500).json({ error: "Failed to delete deal" });
  }
});

// ============================================================
// POST /:id/stakeholders — Add stakeholder
// ============================================================
router.post("/:id/stakeholders", (req, res) => {
  try {
    const deal = db
      .select()
      .from(deals)
      .where(and(eq(deals.id, Number(req.params.id)), eq(deals.userId, req.userId)))
      .get();
    if (!deal) return res.status(404).json({ error: "Deal not found" });

    const { name, email, role } = req.body;
    if (!name || !email) return res.status(400).json({ error: "Name and email are required" });

    const result = db
      .insert(stakeholders)
      .values({
        dealId: deal.id,
        name,
        email,
        role: role || "influencer",
        addedManually: true,
      })
      .returning()
      .get();

    addActivity(deal.id, "stakeholder_added", `${name} (${role || "influencer"}) added to deal`, {
      stakeholderId: result.id,
      email,
    });

    res.status(201).json({ stakeholder: result });
  } catch (err) {
    console.error("[Stakeholder Add Error]", err);
    res.status(500).json({ error: "Failed to add stakeholder" });
  }
});

// ============================================================
// PUT /:id/stakeholders/:sid — Update stakeholder role
// ============================================================
router.put("/:id/stakeholders/:sid", (req, res) => {
  try {
    const deal = db
      .select()
      .from(deals)
      .where(and(eq(deals.id, Number(req.params.id)), eq(deals.userId, req.userId)))
      .get();
    if (!deal) return res.status(404).json({ error: "Deal not found" });

    const { role, name } = req.body;
    const updates = {};
    if (role) updates.role = role;
    if (name) updates.name = name;

    db.update(stakeholders)
      .set(updates)
      .where(and(eq(stakeholders.id, Number(req.params.sid)), eq(stakeholders.dealId, deal.id)))
      .run();

    const updated = db
      .select()
      .from(stakeholders)
      .where(eq(stakeholders.id, Number(req.params.sid)))
      .get();
    res.json({ stakeholder: updated });
  } catch (err) {
    console.error("[Stakeholder Update Error]", err);
    res.status(500).json({ error: "Failed to update stakeholder" });
  }
});

// ============================================================
// DELETE /:id/stakeholders/:sid — Remove stakeholder
// ============================================================
router.delete("/:id/stakeholders/:sid", (req, res) => {
  try {
    const deal = db
      .select()
      .from(deals)
      .where(and(eq(deals.id, Number(req.params.id)), eq(deals.userId, req.userId)))
      .get();
    if (!deal) return res.status(404).json({ error: "Deal not found" });

    db.delete(stakeholders)
      .where(and(eq(stakeholders.id, Number(req.params.sid)), eq(stakeholders.dealId, deal.id)))
      .run();
    res.json({ ok: true });
  } catch (err) {
    console.error("[Stakeholder Delete Error]", err);
    res.status(500).json({ error: "Failed to remove stakeholder" });
  }
});

// ============================================================
// POST /:id/detect-stakeholders — Auto-detect from viewer emails
// ============================================================
router.post("/:id/detect-stakeholders", (req, res) => {
  try {
    const deal = db
      .select()
      .from(deals)
      .where(and(eq(deals.id, Number(req.params.id)), eq(deals.userId, req.userId)))
      .get();
    if (!deal) return res.status(404).json({ error: "Deal not found" });

    const wsDocs = getWorkspaceDocs(deal.workspaceId, req.userId);
    const docIds = wsDocs.map((d) => d.documentId);
    if (!docIds.length) return res.json({ detected: 0, stakeholders: [] });

    const views = getViewsForDocuments(docIds);

    // Get unique emails from views
    const emailSet = new Set();
    for (const v of views) {
      if (v.viewerEmail) emailSet.add(v.viewerEmail.toLowerCase());
    }

    // Get existing stakeholder emails
    const existingStakeholders = db
      .select({ email: stakeholders.email })
      .from(stakeholders)
      .where(eq(stakeholders.dealId, deal.id))
      .all();
    const existingEmails = new Set(existingStakeholders.map((s) => s.email.toLowerCase()));

    // Add new stakeholders
    const newStakeholders = [];
    for (const email of emailSet) {
      if (!existingEmails.has(email)) {
        const name = email
          .split("@")[0]
          .replace(/[._-]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        const result = db
          .insert(stakeholders)
          .values({
            dealId: deal.id,
            name,
            email,
            role: "influencer",
            addedManually: false,
          })
          .returning()
          .get();
        newStakeholders.push(result);
        addActivity(deal.id, "stakeholder_added", `${name} auto-detected from document views`, {
          stakeholderId: result.id,
          email,
          autoDetected: true,
        });
      }
    }

    res.json({ detected: newStakeholders.length, stakeholders: newStakeholders });
  } catch (err) {
    console.error("[Detect Stakeholders Error]", err);
    res.status(500).json({ error: "Failed to detect stakeholders" });
  }
});

// ============================================================
// GET /:id/intent-graph — Nodes + edges for SVG graph
// ============================================================
router.get("/:id/intent-graph", (req, res) => {
  try {
    const deal = db
      .select()
      .from(deals)
      .where(and(eq(deals.id, Number(req.params.id)), eq(deals.userId, req.userId)))
      .get();
    if (!deal) return res.status(404).json({ error: "Deal not found" });

    const dealStakeholders = db.select().from(stakeholders).where(eq(stakeholders.dealId, deal.id)).all();

    const wsDocs = getWorkspaceDocs(deal.workspaceId, req.userId);
    const docIds = wsDocs.map((d) => d.documentId);
    const views = getViewsForDocuments(docIds);

    // Build stakeholder nodes
    const stakeholderNodes = dealStakeholders.map((s) => {
      const myViews = views.filter((v) => v.viewerEmail && v.viewerEmail.toLowerCase() === s.email.toLowerCase());
      const score = computeEngagementScore(myViews);
      return {
        id: `s-${s.id}`,
        type: "stakeholder",
        name: s.name,
        email: s.email,
        role: s.role,
        score,
        tier: score >= 70 ? "hot" : score >= 40 ? "warm" : "cold",
      };
    });

    // Build document nodes
    const documentNodes = wsDocs.map((d) => {
      const docViews = views.filter((v) => v.documentId === d.documentId);
      return {
        id: `d-${d.documentId}`,
        type: "document",
        title: d.title,
        totalViews: docViews.length,
      };
    });

    // Build edges (stakeholder → document interactions)
    const edges = [];
    for (const s of dealStakeholders) {
      const myViews = views.filter((v) => v.viewerEmail && v.viewerEmail.toLowerCase() === s.email.toLowerCase());
      // Group by document
      const byDoc = {};
      for (const v of myViews) {
        if (!byDoc[v.documentId]) byDoc[v.documentId] = { totalTime: 0, maxCompletion: 0, views: 0 };
        byDoc[v.documentId].totalTime += Number(v.duration) || 0;
        const comp = v.totalPages > 0 ? (Number(v.pagesViewed) || 0) / Number(v.totalPages) : 0;
        byDoc[v.documentId].maxCompletion = Math.max(byDoc[v.documentId].maxCompletion, comp);
        byDoc[v.documentId].views += 1;
      }
      for (const [docId, data] of Object.entries(byDoc)) {
        edges.push({
          source: `s-${s.id}`,
          target: `d-${docId}`,
          timeSpent: data.totalTime,
          completion: Math.round(data.maxCompletion * 100),
          views: data.views,
        });
      }
    }

    res.json({ stakeholderNodes, documentNodes, edges });
  } catch (err) {
    console.error("[Intent Graph Error]", err);
    res.status(500).json({ error: "Failed to build intent graph" });
  }
});

// ============================================================
// GET /:id/risk — Risk scoring breakdown
// ============================================================
router.get("/:id/risk", (req, res) => {
  try {
    const deal = db
      .select()
      .from(deals)
      .where(and(eq(deals.id, Number(req.params.id)), eq(deals.userId, req.userId)))
      .get();
    if (!deal) return res.status(404).json({ error: "Deal not found" });

    const dealStakeholders = db.select().from(stakeholders).where(eq(stakeholders.dealId, deal.id)).all();

    const wsDocs = getWorkspaceDocs(deal.workspaceId, req.userId);
    const docIds = wsDocs.map((d) => d.documentId);
    const allViews = getViewsForDocuments(docIds);

    let riskScore = 100;
    const signals = [];

    // Compute per-stakeholder scores
    const stakeholderScores = dealStakeholders.map((s) => {
      const myViews = allViews.filter((v) => v.viewerEmail && v.viewerEmail.toLowerCase() === s.email.toLowerCase());
      const score = computeEngagementScore(myViews);
      const lastView = myViews.length > 0 ? myViews[0].viewedAt : null;
      return { ...s, score, lastView, viewCount: myViews.length };
    });

    // Signal 1: stalled — no views in 7+ days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recentViews = allViews.filter((v) => v.viewedAt >= sevenDaysAgo);
    if (allViews.length > 0 && recentViews.length === 0) {
      signals.push({
        signal: "stalled",
        severity: "high",
        penalty: -30,
        description: "No document views in the last 7 days",
      });
      riskScore -= 30;
    }

    // Signal 2: single_threaded — ≤1 stakeholder engaging when >1 exist
    if (dealStakeholders.length > 1) {
      const engagingCount = stakeholderScores.filter((s) => s.viewCount > 0).length;
      if (engagingCount <= 1) {
        signals.push({
          signal: "single_threaded",
          severity: "medium",
          penalty: -20,
          description: `Only ${engagingCount} of ${dealStakeholders.length} stakeholders have engaged`,
        });
        riskScore -= 20;
      }
    }

    // Signal 3: champion_weak — Champion score dropped >15pts vs 14 days ago
    const champion = stakeholderScores.find((s) => s.role === "champion");
    if (champion) {
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const championOldViews = allViews.filter(
        (v) =>
          v.viewerEmail && v.viewerEmail.toLowerCase() === champion.email.toLowerCase() && v.viewedAt < fourteenDaysAgo,
      );
      const oldScore = computeEngagementScore(championOldViews);
      if (oldScore > 0 && oldScore - champion.score > 15) {
        signals.push({
          signal: "champion_weak",
          severity: "high",
          penalty: -25,
          description: `Champion engagement dropped from ${oldScore} to ${champion.score}`,
        });
        riskScore -= 25;
      }
    }

    // Signal 4: legal_delay — Stage=negotiation, legal has 0 views
    if (deal.stage === "negotiation") {
      const legalStakeholder = stakeholderScores.find((s) => s.role === "legal");
      if (legalStakeholder && legalStakeholder.viewCount === 0) {
        signals.push({
          signal: "legal_delay",
          severity: "medium",
          penalty: -15,
          description: "Legal stakeholder has not viewed any documents",
        });
        riskScore -= 15;
      }
    }

    // Signal 5: ghost_risk — Stakeholder viewed once, 5+ days ago
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    let ghostPenalty = 0;
    for (const s of stakeholderScores) {
      if (s.viewCount === 1 && s.lastView && s.lastView < fiveDaysAgo) {
        if (ghostPenalty < 20) {
          signals.push({
            signal: "ghost_risk",
            severity: "low",
            penalty: -10,
            description: `${s.name} viewed once but went silent`,
          });
          ghostPenalty += 10;
          riskScore -= 10;
        }
      }
    }

    riskScore = Math.max(0, riskScore);
    const healthStatus = computeHealthStatus(riskScore);

    // Update cached health status
    db.update(deals).set({ healthStatus, updatedAt: new Date().toISOString() }).where(eq(deals.id, deal.id)).run();

    res.json({
      riskScore,
      healthStatus,
      signals,
      stakeholderScores: stakeholderScores.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        role: s.role,
        score: s.score,
        viewCount: s.viewCount,
        lastView: s.lastView,
      })),
    });
  } catch (err) {
    console.error("[Risk Scoring Error]", err);
    res.status(500).json({ error: "Failed to calculate risk" });
  }
});

// ============================================================
// GET /:id/actions — Next best actions
// ============================================================
router.get("/:id/actions", (req, res) => {
  try {
    const deal = db
      .select()
      .from(deals)
      .where(and(eq(deals.id, Number(req.params.id)), eq(deals.userId, req.userId)))
      .get();
    if (!deal) return res.status(404).json({ error: "Deal not found" });

    const dealStakeholders = db.select().from(stakeholders).where(eq(stakeholders.dealId, deal.id)).all();

    const wsDocs = getWorkspaceDocs(deal.workspaceId, req.userId);
    const docIds = wsDocs.map((d) => d.documentId);
    const allViews = getViewsForDocuments(docIds);

    const actions = [];
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const stakeholderScores = dealStakeholders.map((s) => {
      const myViews = allViews.filter((v) => v.viewerEmail && v.viewerEmail.toLowerCase() === s.email.toLowerCase());
      const score = computeEngagementScore(myViews);
      const lastView = myViews.length > 0 ? myViews[0].viewedAt : null;
      return { ...s, score, lastView, viewCount: myViews.length, views: myViews };
    });

    const engagingCount = stakeholderScores.filter((s) => s.viewCount > 0).length;

    // 1. re_engage_stalled — no views in 8+ days
    for (const s of stakeholderScores) {
      if (s.viewCount > 0 && s.lastView && s.lastView < eightDaysAgo) {
        actions.push({
          action: "re_engage_stalled",
          priority: "high",
          type: "contact",
          target: s.name,
          email: s.email,
          description: `Re-engage ${s.name} — no activity in 8+ days`,
        });
      }
    }

    // 2. expand_thread — ≤1 of N stakeholders engaging
    if (dealStakeholders.length > 1 && engagingCount <= 1) {
      const inactive = stakeholderScores.filter((s) => s.viewCount === 0);
      for (const s of inactive) {
        actions.push({
          action: "expand_thread",
          priority: "high",
          type: "contact",
          target: s.name,
          email: s.email,
          description: `Bring ${s.name} (${s.role}) into the conversation — deal is single-threaded`,
        });
      }
    }

    // 3. add_technical — no technical role in proposal+
    const advancedStages = ["proposal", "negotiation", "closed_won"];
    if (advancedStages.includes(deal.stage)) {
      const hasTechnical = dealStakeholders.some((s) => s.role === "technical");
      if (!hasTechnical) {
        actions.push({
          action: "add_technical",
          priority: "medium",
          type: "contact",
          target: null,
          description: "Add a technical stakeholder — deal is in advanced stage with no technical reviewer",
        });
      }
    }

    // 4. send_updated_pricing — stakeholder spent 3+ min on any doc (proxy for pricing)
    for (const s of stakeholderScores) {
      for (const v of s.views) {
        if ((Number(v.duration) || 0) >= 180) {
          actions.push({
            action: "send_updated_pricing",
            priority: "high",
            type: "send_doc",
            target: s.name,
            email: s.email,
            description: `${s.name} spent ${Math.round((Number(v.duration) || 0) / 60)}+ min on "${v.documentTitle}" — consider sending updated materials`,
          });
          break; // one per stakeholder
        }
      }
    }

    // 5. schedule_followup — decision_maker/champion hit 85%+ completion in 48h
    for (const s of stakeholderScores) {
      if (s.role === "decision_maker" || s.role === "champion") {
        const recentHighCompletion = s.views.some((v) => {
          const completion = v.totalPages > 0 ? (Number(v.pagesViewed) || 0) / Number(v.totalPages) : 0;
          return completion >= 0.85 && v.viewedAt >= fortyEightHoursAgo;
        });
        if (recentHighCompletion) {
          actions.push({
            action: "schedule_followup",
            priority: "high",
            type: "schedule",
            target: s.name,
            email: s.email,
            description: `Schedule follow-up with ${s.name} — they completed 85%+ of a document recently`,
          });
        }
      }
    }

    // 6. champion_cooling — champion score declining >15pts
    const champion = stakeholderScores.find((s) => s.role === "champion");
    if (champion) {
      const championOldViews = allViews.filter(
        (v) =>
          v.viewerEmail && v.viewerEmail.toLowerCase() === champion.email.toLowerCase() && v.viewedAt < fourteenDaysAgo,
      );
      const oldScore = computeEngagementScore(championOldViews);
      if (oldScore > 0 && oldScore - champion.score > 15) {
        actions.push({
          action: "champion_cooling",
          priority: "high",
          type: "contact",
          target: champion.name,
          email: champion.email,
          description: `Champion ${champion.name}'s engagement is declining (${oldScore} → ${champion.score}) — reach out`,
        });
      }
    }

    // 7. legal_not_engaged — legal role, 0 views in negotiation
    if (deal.stage === "negotiation") {
      const legalStakeholder = stakeholderScores.find((s) => s.role === "legal");
      if (legalStakeholder && legalStakeholder.viewCount === 0) {
        actions.push({
          action: "legal_not_engaged",
          priority: "medium",
          type: "contact",
          target: legalStakeholder.name,
          email: legalStakeholder.email,
          description: `Legal (${legalStakeholder.name}) hasn't reviewed any documents — may delay closing`,
        });
      }
    }

    // 8. ghost_reengagement — viewed once, 5+ days silent
    for (const s of stakeholderScores) {
      if (s.viewCount === 1 && s.lastView && s.lastView < fiveDaysAgo) {
        actions.push({
          action: "ghost_reengagement",
          priority: "low",
          type: "contact",
          target: s.name,
          email: s.email,
          description: `${s.name} viewed once then went silent — gentle follow-up recommended`,
        });
      }
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    actions.sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2));

    res.json({ actions });
  } catch (err) {
    console.error("[Actions Error]", err);
    res.status(500).json({ error: "Failed to generate actions" });
  }
});

// ============================================================
// GET /:id/brief — Executive brief
// ============================================================
router.get("/:id/brief", (req, res) => {
  try {
    const deal = db
      .select({
        id: deals.id,
        userId: deals.userId,
        workspaceId: deals.workspaceId,
        accountName: deals.accountName,
        stage: deals.stage,
        value: deals.value,
        currency: deals.currency,
        closeDate: deals.closeDate,
        stageEnteredAt: deals.stageEnteredAt,
        healthStatus: deals.healthStatus,
        workspaceName: workspaces.name,
      })
      .from(deals)
      .innerJoin(workspaces, eq(deals.workspaceId, workspaces.id))
      .where(and(eq(deals.id, Number(req.params.id)), eq(deals.userId, req.userId)))
      .get();
    if (!deal) return res.status(404).json({ error: "Deal not found" });

    const dealStakeholders = db.select().from(stakeholders).where(eq(stakeholders.dealId, deal.id)).all();

    const wsDocs = getWorkspaceDocs(deal.workspaceId, req.userId);
    const docIds = wsDocs.map((d) => d.documentId);
    const allViews = getViewsForDocuments(docIds);

    const daysInStage = Math.floor((Date.now() - new Date(deal.stageEnteredAt).getTime()) / (1000 * 60 * 60 * 24));

    // Stakeholder matrix
    const stakeholderMatrix = dealStakeholders.map((s) => {
      const myViews = allViews.filter((v) => v.viewerEmail && v.viewerEmail.toLowerCase() === s.email.toLowerCase());
      const score = computeEngagementScore(myViews);
      const lastView = myViews.length > 0 ? myViews[0].viewedAt : null;
      return {
        name: s.name,
        email: s.email,
        role: s.role,
        engaged: myViews.length > 0,
        score,
        viewCount: myViews.length,
        lastActivity: lastView,
      };
    });

    // Key signals
    const positiveSignals = [];
    const negativeSignals = [];

    // Positive: champion reading 3x+
    const champion = stakeholderMatrix.find((s) => s.role === "champion");
    if (champion && champion.viewCount >= 3) {
      positiveSignals.push(`Champion (${champion.name}) has viewed documents ${champion.viewCount} times`);
    }

    // Positive: multi-threaded
    const engagingCount = stakeholderMatrix.filter((s) => s.engaged).length;
    if (engagingCount >= 3) {
      positiveSignals.push(`${engagingCount} stakeholders actively engaging — deal is well multi-threaded`);
    }

    // Positive: high recent activity
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const recentViewCount = allViews.filter((v) => v.viewedAt >= threeDaysAgo).length;
    if (recentViewCount >= 5) {
      positiveSignals.push(`${recentViewCount} document views in the last 3 days — high engagement`);
    }

    // Negative: decision-maker absent
    const dm = stakeholderMatrix.find((s) => s.role === "decision_maker");
    if (dm && !dm.engaged) {
      negativeSignals.push(`Decision maker (${dm.name}) has not engaged with any documents`);
    }

    // Negative: stalled
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    if (allViews.length > 0 && allViews.every((v) => v.viewedAt < sevenDaysAgo)) {
      negativeSignals.push("No document views in the last 7 days — deal may be stalling");
    }

    // Negative: champion declining
    if (champion) {
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const oldViews = allViews.filter(
        (v) =>
          v.viewerEmail && v.viewerEmail.toLowerCase() === champion.email.toLowerCase() && v.viewedAt < fourteenDaysAgo,
      );
      const oldScore = computeEngagementScore(oldViews);
      if (oldScore > 0 && oldScore - champion.score > 15) {
        negativeSignals.push(`Champion engagement declining (${oldScore} → ${champion.score})`);
      }
    }

    // Talking points
    const talkingPoints = [];
    if (champion && champion.score >= 70) {
      talkingPoints.push(`Leverage strong champion engagement — ${champion.name} is highly active`);
    }
    if (dm && dm.engaged && dm.score >= 50) {
      talkingPoints.push(`Decision maker is engaged — consider proposing next steps`);
    }
    if (engagingCount < dealStakeholders.length && dealStakeholders.length > 1) {
      const inactive = stakeholderMatrix.filter((s) => !s.engaged).map((s) => s.name);
      talkingPoints.push(`Bring in inactive stakeholders: ${inactive.join(", ")}`);
    }
    if (deal.stage === "proposal" || deal.stage === "negotiation") {
      const hasLegal = dealStakeholders.some((s) => s.role === "legal");
      if (!hasLegal) {
        talkingPoints.push("Consider identifying and adding legal/procurement stakeholders");
      }
    }
    if (recentViewCount >= 5) {
      talkingPoints.push("Capitalize on high engagement momentum — move to next stage");
    }

    res.json({
      overview: {
        accountName: deal.accountName,
        stage: deal.stage,
        value: deal.value,
        currency: deal.currency,
        daysInStage,
        healthStatus: deal.healthStatus,
        closeDate: deal.closeDate,
        totalDocuments: wsDocs.length,
        totalViews: allViews.length,
      },
      stakeholderMatrix,
      positiveSignals,
      negativeSignals,
      talkingPoints,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[Brief Error]", err);
    res.status(500).json({ error: "Failed to generate brief" });
  }
});

// ============================================================
// GET /:id/timeline — Activity timeline
// ============================================================
router.get("/:id/timeline", (req, res) => {
  try {
    const deal = db
      .select()
      .from(deals)
      .where(and(eq(deals.id, Number(req.params.id)), eq(deals.userId, req.userId)))
      .get();
    if (!deal) return res.status(404).json({ error: "Deal not found" });

    const activities = db
      .select()
      .from(dealActivities)
      .where(eq(dealActivities.dealId, deal.id))
      .orderBy(desc(dealActivities.createdAt))
      .all();

    res.json({
      activities: activities.map((a) => ({
        ...a,
        metadata: a.metadata ? JSON.parse(a.metadata) : null,
      })),
    });
  } catch (err) {
    console.error("[Timeline Error]", err);
    res.status(500).json({ error: "Failed to load timeline" });
  }
});

module.exports = router;
