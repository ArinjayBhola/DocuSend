import { NotificationsRepository } from './notifications.repository.js';
import { NotificationListResult } from './notifications.types.js';

export class NotificationsService {
  private repository: NotificationsRepository;

  constructor() {
    this.repository = new NotificationsRepository();
  }

  async getNotifications(userId: number): Promise<NotificationListResult> {
    const notifications = await this.repository.findAllByUser(userId);
    const unreadCount = await this.repository.getUnreadCount(userId);
    return { notifications, unreadCount };
  }

  async getUnreadCount(userId: number) {
    return this.repository.getUnreadCount(userId);
  }

  async markAsRead(id: number, userId: number) {
    await this.repository.markAsRead(id, userId);
  }

  async markAllAsRead(userId: number) {
    await this.repository.markAllAsRead(userId);
  }

  async getPreferences(userId: number) {
    let prefs = await this.repository.findPreferences(userId);
    if (!prefs) {
      prefs = await this.repository.createPreferences(userId);
    }
    return prefs;
  }

  async updatePreferences(userId: number, data: any) {
    await this.getPreferences(userId); // Ensure they exist

    const updates: any = {};
    if (typeof data.emailOnView === 'boolean') updates.emailOnView = data.emailOnView;
    if (typeof data.emailOnEmailCapture === 'boolean') updates.emailOnEmailCapture = data.emailOnEmailCapture;
    if (typeof data.inAppNotifications === 'boolean') updates.inAppNotifications = data.inAppNotifications;

    await this.repository.updatePreferences(userId, updates);
    return this.repository.findPreferences(userId);
  }
}
