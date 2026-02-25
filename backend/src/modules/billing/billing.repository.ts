import { eq } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { users, subscriptions } from '../../db/schema.js';
import { NewSubscription, Subscription, PlanType } from './billing.types.js';

export class BillingRepository {
  async getSubscriptionByUserId(userId: number): Promise<Subscription | undefined> {
    return db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(subscriptions.id)
      .get();
  }

  async getSubscriptionByRazorpayId(id: string): Promise<Subscription | undefined> {
    return db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.razorpaySubscriptionId, id))
      .get();
  }

  async createSubscription(data: NewSubscription): Promise<void> {
    db.insert(subscriptions).values(data).run();
  }

  async updateSubscriptionStatus(id: string, status: string): Promise<void> {
    db.update(subscriptions)
      .set({ status })
      .where(eq(subscriptions.razorpaySubscriptionId, id))
      .run();
  }

  async updateUserPlan(userId: number, plan: PlanType, razorpaySubscriptionId: string | null): Promise<void> {
    db.update(users)
      .set({ plan, razorpaySubscriptionId })
      .where(eq(users.id, userId))
      .run();
  }

  async findUserByRazorpayCustomerId(customerId: string) {
    return db.select().from(users).where(eq(users.razorpayCustomerId, customerId)).get();
  }

  async findUserByRazorpaySubscriptionId(id: string) {
    return db.select().from(users).where(eq(users.razorpaySubscriptionId, id)).get();
  }

  async updateRazorpayCustomerId(userId: number, customerId: string): Promise<void> {
    db.update(users).set({ razorpayCustomerId: customerId }).where(eq(users.id, userId)).run();
  }
}
