import { eq } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { users, subscriptions } from '../../db/schema.js';
export class BillingRepository {
    async getSubscriptionByUserId(userId) {
        return db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.userId, userId))
            .orderBy(subscriptions.id)
            .get();
    }
    async getSubscriptionByRazorpayId(id) {
        return db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.razorpaySubscriptionId, id))
            .get();
    }
    async createSubscription(data) {
        db.insert(subscriptions).values(data).run();
    }
    async updateSubscriptionStatus(id, status) {
        db.update(subscriptions)
            .set({ status })
            .where(eq(subscriptions.razorpaySubscriptionId, id))
            .run();
    }
    async updateUserPlan(userId, plan, razorpaySubscriptionId) {
        db.update(users)
            .set({ plan, razorpaySubscriptionId })
            .where(eq(users.id, userId))
            .run();
    }
    async findUserByRazorpayCustomerId(customerId) {
        return db.select().from(users).where(eq(users.razorpayCustomerId, customerId)).get();
    }
    async findUserByRazorpaySubscriptionId(id) {
        return db.select().from(users).where(eq(users.razorpaySubscriptionId, id)).get();
    }
    async updateRazorpayCustomerId(userId, customerId) {
        db.update(users).set({ razorpayCustomerId: customerId }).where(eq(users.id, userId)).run();
    }
}
