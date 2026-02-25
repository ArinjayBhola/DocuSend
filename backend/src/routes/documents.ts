const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { eq, and } = require("drizzle-orm");
const { db } = require("../config/db");
const { documents } = require("../db/schema");
const { requireAuth, loadUser } = require("../middleware/auth");
const { checkDocumentLimit } = require("../middleware/planLimits");
const { generateSlug } = require("../utils/helpers");

const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, "..", "..", "uploads"),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const ALLOWED_MIMETYPES = ["application/pdf", "image/png", "image/jpeg", "image/gif", "image/webp"];

const MIMETYPE_TO_FILETYPE = {
  "application/pdf": "pdf",
  "image/png": "image",
  "image/jpeg": "image",
  "image/gif": "image",
  "image/webp": "image",
};

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and image files (PNG, JPG, GIF, WebP) are allowed"));
    }
  },
});

router.post("/upload", requireAuth, loadUser, checkDocumentLimit, (req, res) => {
  upload.single("document")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Please select a file" });
    }

    const ext = path.extname(req.file.originalname);
    const title = req.body.title || req.file.originalname.replace(ext, "");
    const shareSlug = generateSlug();
    const fileType = MIMETYPE_TO_FILETYPE[req.file.mimetype] || "pdf";

    const result = db
      .insert(documents)
      .values({
        userId: req.user.id,
        title,
        fileName: req.file.originalname,
        filePath: req.file.filename,
        fileSize: req.file.size,
        shareSlug,
        fileType,
      })
      .run();

    const document = db
      .select()
      .from(documents)
      .where(eq(documents.id, Number(result.lastInsertRowid)))
      .get();

    res.json({ document });
  });
});

router.get("/:id", requireAuth, loadUser, (req, res) => {
  const doc = db
    .select()
    .from(documents)
    .where(and(eq(documents.id, parseInt(req.params.id)), eq(documents.userId, req.user.id)))
    .get();

  if (!doc) return res.status(404).json({ error: "Document not found" });

  res.json({ document: doc });
});

router.put("/:id", requireAuth, loadUser, (req, res) => {
  const doc = db
    .select()
    .from(documents)
    .where(and(eq(documents.id, parseInt(req.params.id)), eq(documents.userId, req.user.id)))
    .get();

  if (!doc) return res.status(404).json({ error: "Document not found" });

  const { title, password, requireEmail, allowDownload, expiresAt, isActive } = req.body;

  db.update(documents)
    .set({
      title: title || doc.title,
      password: password !== undefined ? password || null : doc.password,
      requireEmail: requireEmail !== undefined ? !!requireEmail : doc.requireEmail,
      allowDownload: allowDownload !== undefined ? !!allowDownload : doc.allowDownload,
      expiresAt: expiresAt !== undefined ? expiresAt || null : doc.expiresAt,
      isActive: isActive !== undefined ? !!isActive : doc.isActive,
    })
    .where(eq(documents.id, doc.id))
    .run();

  const updated = db.select().from(documents).where(eq(documents.id, doc.id)).get();
  res.json({ document: updated });
});

router.delete("/:id", requireAuth, loadUser, (req, res) => {
  const doc = db
    .select()
    .from(documents)
    .where(and(eq(documents.id, parseInt(req.params.id)), eq(documents.userId, req.user.id)))
    .get();

  if (!doc) return res.status(404).json({ error: "Document not found" });

  const filePath = path.join(__dirname, "..", "..", "uploads", doc.filePath);
  try {
    fs.unlinkSync(filePath);
  } catch {
    /* ignore */
  }

  db.delete(documents).where(eq(documents.id, doc.id)).run();
  res.json({ ok: true });
});

module.exports = router;
