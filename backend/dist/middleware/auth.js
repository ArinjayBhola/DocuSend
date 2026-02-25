const jwt = require("jsonwebtoken");
const { eq } = require("drizzle-orm");
const env = require("../config/env");
const { db } = require("../config/db");
const { users } = require("../db/schema");
function requireAuth(req, res, next) {
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).json({ error: "Authentication required" });
    }
    try {
        const payload = jwt.verify(token, env.JWT_SECRET);
        req.userId = payload.userId;
        next();
    }
    catch {
        res.clearCookie("token");
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}
async function loadUser(req, res, next) {
    if (!req.userId)
        return next();
    try {
        const [user] = await db.select().from(users).where(eq(users.id, req.userId)).limit(1);
        if (user) {
            req.user = user;
        }
    }
    catch {
        // ignore
    }
    next();
}
function optionalAuth(req, res, next) {
    const token = req.cookies?.token;
    if (!token)
        return next();
    try {
        const payload = jwt.verify(token, env.JWT_SECRET);
        req.userId = payload.userId;
    }
    catch {
        // ignore
    }
    next();
}
module.exports = { requireAuth, loadUser, optionalAuth };
export {};
