import { User } from '../modules/auth/auth.types.js';

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      user?: User;
    }
  }
}

export {};
