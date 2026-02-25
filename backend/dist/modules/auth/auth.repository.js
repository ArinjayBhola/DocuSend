import { eq } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { users } from '../../db/schema.js';
export class AuthRepository {
    async findByEmail(email) {
        return db.select().from(users).where(eq(users.email, email)).get();
    }
    async findById(id) {
        return db.select().from(users).where(eq(users.id, id)).get();
    }
    async create(data) {
        return db.insert(users).values(data).run();
    }
}
