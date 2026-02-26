import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../../config/db.js";
import { notifications, notificationPreferences } from "../../db/schema.js";
import { NewNotification, NotificationPreference } from "./notifications.types.js";

export class NotificationsRepository {
  async findAllByUser(userId: number, limit: number = 50) {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .all();
  }

  async getUnreadCount(userId: number) {
    const result = db
      .select({ count: sql`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
      .get() as { count: number };
    return result.count;
  }

  async markAsRead(id: number, userId: number) {
    db.update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .run();
  }

  async markAllAsRead(userId: number) {
    db.update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
      .run();
  }

  async findPreferences(userId: number) {
    return db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).get();
  }

  async createPreferences(userId: number) {
    return db.insert(notificationPreferences).values({ userId }).returning().get();
  }

  async updatePreferences(userId: number, data: Partial<NotificationPreference>) {
    db.update(notificationPreferences).set(data).where(eq(notificationPreferences.userId, userId)).run();
  }

  async createNotification(data: NewNotification) {
    return db.insert(notifications).values(data).returning().get();
  }
}
