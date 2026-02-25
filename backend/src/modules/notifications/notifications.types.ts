import { notifications, notificationPreferences } from '../../db/schema.js';

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreference = typeof notificationPreferences.$inferInsert;

export interface NotificationListResult {
  notifications: Notification[];
  unreadCount: number;
}
