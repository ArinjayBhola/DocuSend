import { Request, Response, NextFunction } from 'express';
import { eq, sql, and } from 'drizzle-orm';
import { db } from '../config/db.js';
import { documents, deals, sessions } from '../db/schema.js';
import { getPlanLimits } from '../modules/billing/index.js';

export function checkDocumentLimit(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'User not loaded' });
  
  const limits = getPlanLimits(req.user.plan);
  if (limits.documents === Infinity) return next();

  const result = db
    .select({ count: sql`count(*)` })
    .from(documents)
    .where(eq(documents.userId, req.user.id))
    .get() as { count: number };

  if (result.count >= limits.documents) {
    return res.status(403).json({
      error: `You've reached the ${limits.documents} document limit on the ${req.user.plan} plan. Upgrade to upload more.`,
    });
  }
  next();
}

export function checkWorkspaceLimit(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'User not loaded' });

  const limits = getPlanLimits(req.user.plan);
  if (limits.workspaces === Infinity) return next();
  if (limits.workspaces === 0) {
    return res.status(403).json({
      error: 'Workspaces are not available on the free plan. Upgrade to Pro or Business.',
    });
  }
  next();
}

export function checkDealLimit(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'User not loaded' });

  const limits = getPlanLimits(req.user.plan);
  if (limits.deals === Infinity) return next();
  if (limits.deals === 0) {
    return res.status(403).json({
      error: 'Deal Intelligence is not available on the free plan. Upgrade to Pro or Business.',
    });
  }

  const result = db
    .select({ count: sql`count(*)` })
    .from(deals)
    .where(eq(deals.userId, req.user.id))
    .get() as { count: number };

  if (result.count >= limits.deals) {
    return res.status(403).json({
      error: `You've reached the ${limits.deals} deal limit on the ${req.user.plan} plan. Upgrade to add more.`,
    });
  }
  next();
}

export function checkSessionLimit(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'User not loaded' });

  const limits = getPlanLimits(req.user.plan);
  if (limits.sessions === Infinity) return next();
  if (limits.sessions === 0) {
    return res.status(403).json({
      error: 'Collaborative Sessions are not available on the free plan. Upgrade to Pro or Business.',
    });
  }

  const result = db
    .select({ count: sql`count(*)` })
    .from(sessions)
    .where(and(eq(sessions.userId, req.user.id), sql`status != 'ended'`))
    .get() as { count: number };

  if (result.count >= limits.sessions) {
    return res.status(403).json({
      error: `You've reached the ${limits.sessions} active session limit on the ${req.user.plan} plan. End existing sessions or upgrade.`,
    });
  }
  next();
}
