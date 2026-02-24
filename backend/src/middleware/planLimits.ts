const { eq, sql } = require('drizzle-orm');
const { db } = require('../config/db');
const { documents } = require('../db/schema');
const { getPlanLimits } = require('../utils/helpers');

function checkDocumentLimit(req, res, next) {
  const limits = getPlanLimits(req.user.plan);
  if (limits.documents === Infinity) return next();

  const result = db.select({ count: sql`count(*)` })
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
  if (limits.workspaces === Infinity) return next();
  if (limits.workspaces === 0) {
    return res.status(403).json({
      error: 'Workspaces are not available on the free plan. Upgrade to Pro or Business.',
    });
  }
  next();
}

module.exports = { checkDocumentLimit, checkWorkspaceLimit };
