const express = require("express");
const { eq, and, desc, sql } = require("drizzle-orm");
const { db } = require("../config/db");
const { workspaces, workspaceDocuments, documents } = require("../db/schema");
const { requireAuth, loadUser } = require("../middleware/auth");
const { checkWorkspaceLimit } = require("../middleware/planLimits");
const { generateSlug } = require("../utils/helpers");

const router = express.Router();

router.get("/", requireAuth, loadUser, (req, res) => {
  const userWorkspaces = db
    .select()
    .from(workspaces)
    .where(eq(workspaces.userId, req.user.id))
    .orderBy(desc(workspaces.createdAt))
    .all();

  const workspacesWithCounts = userWorkspaces.map((ws) => {
    const docCount = db
      .select({ count: sql`count(*)` })
      .from(workspaceDocuments)
      .where(eq(workspaceDocuments.workspaceId, ws.id))
      .get();
    return { ...ws, docCount: docCount?.count || 0 };
  });

  res.json({ workspaces: workspacesWithCounts });
});

router.post("/", requireAuth, loadUser, checkWorkspaceLimit, (req, res) => {
  const { name, description } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ error: "Name is required" });
  }

  const slug = generateSlug();
  const result = db
    .insert(workspaces)
    .values({
      userId: req.user.id,
      name: name.trim(),
      slug,
      description: description?.trim() || null,
    })
    .run();

  const workspace = db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, Number(result.lastInsertRowid)))
    .get();

  res.json({ workspace });
});

router.get("/:id", requireAuth, loadUser, (req, res) => {
  const workspace = db
    .select()
    .from(workspaces)
    .where(and(eq(workspaces.id, parseInt(req.params.id)), eq(workspaces.userId, req.user.id)))
    .get();

  if (!workspace) return res.status(404).json({ error: "Workspace not found" });

  const wsDocs = db
    .select({
      id: workspaceDocuments.id,
      order: workspaceDocuments.order,
      docId: documents.id,
      title: documents.title,
      fileName: documents.fileName,
      fileSize: documents.fileSize,
      shareSlug: documents.shareSlug,
      createdAt: documents.createdAt,
    })
    .from(workspaceDocuments)
    .innerJoin(documents, eq(workspaceDocuments.documentId, documents.id))
    .where(eq(workspaceDocuments.workspaceId, workspace.id))
    .orderBy(workspaceDocuments.order)
    .all();

  const allDocs = db
    .select()
    .from(documents)
    .where(eq(documents.userId, req.user.id))
    .orderBy(desc(documents.createdAt))
    .all();

  res.json({ workspace, documents: wsDocs, allDocs });
});

router.post("/:id/documents", requireAuth, loadUser, (req, res) => {
  const workspace = db
    .select()
    .from(workspaces)
    .where(and(eq(workspaces.id, parseInt(req.params.id)), eq(workspaces.userId, req.user.id)))
    .get();

  if (!workspace) return res.status(404).json({ error: "Workspace not found" });

  const { documentId } = req.body;
  const maxOrder = db
    .select({ max: sql`coalesce(max("order"), 0)` })
    .from(workspaceDocuments)
    .where(eq(workspaceDocuments.workspaceId, workspace.id))
    .get();

  db.insert(workspaceDocuments)
    .values({
      workspaceId: workspace.id,
      documentId: parseInt(documentId),
      order: (maxOrder?.max || 0) + 1,
    })
    .run();

  res.json({ ok: true });
});

router.delete("/:id/documents/:wdId", requireAuth, loadUser, (req, res) => {
  db.delete(workspaceDocuments)
    .where(eq(workspaceDocuments.id, parseInt(req.params.wdId)))
    .run();
  res.json({ ok: true });
});

router.delete("/:id", requireAuth, loadUser, (req, res) => {
  db.delete(workspaces)
    .where(and(eq(workspaces.id, parseInt(req.params.id)), eq(workspaces.userId, req.user.id)))
    .run();
  res.json({ ok: true });
});

// Public workspace view
router.get("/public/:slug", (req, res) => {
  const workspace = db.select().from(workspaces).where(eq(workspaces.slug, req.params.slug)).get();

  if (!workspace) return res.status(404).json({ error: "Workspace not found" });

  const wsDocs = db
    .select({
      title: documents.title,
      shareSlug: documents.shareSlug,
      fileSize: documents.fileSize,
    })
    .from(workspaceDocuments)
    .innerJoin(documents, eq(workspaceDocuments.documentId, documents.id))
    .where(eq(workspaceDocuments.workspaceId, workspace.id))
    .orderBy(workspaceDocuments.order)
    .all();

  res.json({ workspace, documents: wsDocs });
});

module.exports = router;
