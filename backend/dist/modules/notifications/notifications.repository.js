import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { notifications, notificationPreferences } from '../../db/schema.js';
export class NotificationsRepository {
    async findAllByUser(userId, limit = 50) {
        return db
            .select()
            .from(notifications)
            .where(eq(notifications.userId, userId))
            .orderBy(desc(notifications.createdAt))
            .limit(limit)
            .all();
    }
    async getUnreadCount(userId) {
        const result = db
            .select({ count: sql `count(*)` })
            .from(notifications)
            .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
            .get();
        return result.count;
    }
    async markAsRead(id, userId) {
        db.update(notifications)
            .set({ isRead: true })
            .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
            .run();
    }
    async markAllAsRead(userId) {
        db.update(notifications)
            .set({ isRead: true })
            .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
            .run();
    }
    async findPreferences(userId) {
        return db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).get();
    }
    async createPreferences(userId) {
        return db.insert(notificationPreferences).values({ userId }).returning().get();
    }
    async updatePreferences(userId, data) {
        db.update(notificationPreferences).set(data).where(eq(notificationPreferences.userId, userId)).run();
    }
    async createNotification(data) {
        return db.insert(notifications).values(data).returning().get();
    }
}
