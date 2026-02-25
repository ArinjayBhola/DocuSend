import { Request, Response, NextFunction } from 'express';
import { sql, eq, and } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { documents, deals, sessions } from '../../db/schema.js';
import { getPlanLimits } from './plan.constants.js';
import { ForbiddenError } from '../../core/errors/AppError.js';

export const checkDocumentLimit = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return next();
  const limits = getPlanLimits(req.user.plan);
  if (limits.documents === Infinity) return next();

  const result = db
    .select({ count: sql`count(*)` })
    .from(documents)
    .where(eq(documents.userId, req.user.id))
    .get() as { count: number };

  if (result.count >= limits.documents) {
    throw new ForbiddenError(`You've reached the ${limits.documents} document limit on the ${req.user.plan} plan. Upgrade to upload more.`);
  }
  next();
};

export const checkWorkspaceLimit = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return next();
  const limits = getPlanLimits(req.user.plan);
  if (limits.workspaces === Infinity) return next();
  if (limits.workspaces === 0) {
    throw new ForbiddenError('Workspaces are not available on the free plan. Upgrade to Pro or Business.');
  }
  next();
};

export const checkDealLimit = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return next();
  const limits = getPlanLimits(req.user.plan);
  if (limits.deals === Infinity) return next();
  if (limits.deals === 0) {
    throw new ForbiddenError('Deal Intelligence is not available on the free plan. Upgrade to Pro or Business.');
  }

  const result = db
    .select({ count: sql`count(*)` })
    .from(deals)
    .where(eq(deals.userId, req.user.id))
    .get() as { count: number };

  if (result.count >= limits.deals) {
    throw new ForbiddenError(`You've reached the ${limits.deals} deal limit on the ${req.user.plan} plan. Upgrade to add more.`);
  }
  next();
};

export const checkSessionLimit = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return next();
  const limits = getPlanLimits(req.user.plan);
  if (limits.sessions === Infinity) return next();
  if (limits.sessions === 0) {
    throw new ForbiddenError('Collaborative Sessions are not available on the free plan. Upgrade to Pro or Business.');
  }

  const result = db
    .select({ count: sql`count(*)` })
    .from(sessions)
    .where(and(eq(sessions.userId, req.user.id), sql`status != 'ended'`))
    .get() as { count: number };

  if (result.count >= limits.sessions) {
    throw new ForbiddenError(`You've reached the ${limits.sessions} active session limit on the ${req.user.plan} plan. End existing sessions or upgrade.`);
  }
  next();
};
