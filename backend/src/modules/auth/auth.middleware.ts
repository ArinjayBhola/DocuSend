import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { UnauthorizedError } from '../../core/errors/AppError.js';
import { AuthRepository } from './auth.repository.js';
import { AuthPayload } from './auth.types.js';

const repository = new AuthRepository();

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.token;
  if (!token) {
    throw new UnauthorizedError('Authentication required');
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    req.userId = payload.userId;
    next();
  } catch (err) {
    res.clearCookie('token');
    throw new UnauthorizedError('Invalid or expired token');
  }
};

export const loadUser = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.userId) return next();

  try {
    const user = await repository.findById(req.userId);
    if (user) {
      req.user = user;
    }
  } catch (err) {
    // Ignore error in loading user
  }
  next();
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.token;
  if (!token) return next();

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    req.userId = payload.userId;
  } catch (err) {
    // Ignore invalid token
  }
  next();
};
