import { eq } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { users } from '../../db/schema.js';
import { NewUser, User } from './auth.types.js';

export class AuthRepository {
  async findByEmail(email: string): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.email, email)).get();
  }

  async findById(id: number): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.id, id)).get();
  }

  async create(data: NewUser): Promise<{ lastInsertRowid: number | bigint }> {
    return db.insert(users).values(data).run();
  }
}
