import { users } from '../../db/schema.js';

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export interface AuthResponse {
  user: Omit<User, 'passwordHash'>;
}

export interface AuthPayload {
  userId: number;
}

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      user?: User;
    }
  }
}
