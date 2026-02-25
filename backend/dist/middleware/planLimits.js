const { eq, sql, and } = require("drizzle-orm");
const { db } = require("../config/db");
const { documents } = require("../db/schema");
const { getPlanLimits } = require("../utils/helpers");
function checkDocumentLimit(req, res, next) {
    const limits = getPlanLimits(req.user.plan);
    if (limits.documents === Infinity)
        return next();
    const result = db
        .select({ count: sql `count(*)` })
        .from(documents)
        .where(eq(documents.userId, req.user.id))
        .get();
    if (result.count >= limits.documents) {
        return res.status(403).json({
            error: `You've reached the ${limits.documents} document limit on the ${req.user.plan} plan. Upgrade to upload more.`,
        });
    }
    next();
}
function checkWorkspaceLimit(req, res, next) {
    const limits = getPlanLimits(req.user.plan);
    if (limits.workspaces === Infinity)
        return next();
    if (limits.workspaces === 0) {
        return res.status(403).json({
            error: "Workspaces are not available on the free plan. Upgrade to Pro or Business.",
        });
    }
    next();
}
function checkDealLimit(req, res, next) {
    const limits = getPlanLimits(req.user.plan);
    if (limits.deals === Infinity)
        return next();
    if (limits.deals === 0) {
        return res.status(403).json({
            error: "Deal Intelligence is not available on the free plan. Upgrade to Pro or Business.",
        });
    }
    const { deals } = require("../db/schema");
    const result = db
        .select({ count: sql `count(*)` })
        .from(deals)
        .where(eq(deals.userId, req.user.id))
        .get();
    if (result.count >= limits.deals) {
        return res.status(403).json({
            error: `You've reached the ${limits.deals} deal limit on the ${req.user.plan} plan. Upgrade to add more.`,
        });
    }
    next();
}
function checkSessionLimit(req, res, next) {
    const limits = getPlanLimits(req.user.plan);
    if (limits.sessions === Infinity)
        return next();
    if (limits.sessions === 0) {
        return res.status(403).json({
            error: "Collaborative Sessions are not available on the free plan. Upgrade to Pro or Business.",
        });
    }
    const { sessions } = require("../db/schema");
    const result = db
        .select({ count: sql `count(*)` })
        .from(sessions)
        .where(and(eq(sessions.userId, req.user.id), sql `status != 'ended'`))
        .get();
    if (result.count >= limits.sessions) {
        return res.status(403).json({
            error: `You've reached the ${limits.sessions} active session limit on the ${req.user.plan} plan. End existing sessions or upgrade.`,
        });
    }
    next();
}
module.exports = { checkDocumentLimit, checkWorkspaceLimit, checkDealLimit, checkSessionLimit };
export {};
