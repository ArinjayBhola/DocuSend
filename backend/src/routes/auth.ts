const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { eq } = require("drizzle-orm");
const { body, validationResult } = require("express-validator");
const { db } = require("../config/db");
const { users } = require("../db/schema");
const env = require("../config/env");
const { requireAuth, loadUser } = require("../middleware/auth");

const router = express.Router();

router.post(
  "/register",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
    body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { name, email, password } = req.body;

    const existing = db.select().from(users).where(eq(users.email, email)).get();
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = db.insert(users).values({ name, email, passwordHash }).run();

    const token = jwt.sign({ userId: result.lastInsertRowid }, env.JWT_SECRET, { expiresIn: "30d" });
    res.cookie("token", token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000, sameSite: "lax" });

    const [user] = db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        plan: users.plan,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, Number(result.lastInsertRowid)))
      .limit(1)
      .all();

    res.json({ user });
  },
);

router.post("/login", [body("email").isEmail().normalizeEmail(), body("password").notEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  const { email, password } = req.body;

  const user = db.select().from(users).where(eq(users.email, email)).get();
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: "30d" });
  res.cookie("token", token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000, sameSite: "lax" });

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      createdAt: user.createdAt,
    },
  });
});

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

router.get("/me", requireAuth, loadUser, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "User not found" });
  }
  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      plan: req.user.plan,
      createdAt: req.user.createdAt,
    },
  });
});

module.exports = router;
