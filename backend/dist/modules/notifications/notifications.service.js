import { NotificationsRepository } from './notifications.repository.js';
export class NotificationsService {
    repository;
    constructor() {
        this.repository = new NotificationsRepository();
    }
    async getNotifications(userId) {
        const notifications = await this.repository.findAllByUser(userId);
        const unreadCount = await this.repository.getUnreadCount(userId);
        return { notifications, unreadCount };
    }
    async getUnreadCount(userId) {
        return this.repository.getUnreadCount(userId);
    }
    async markAsRead(id, userId) {
        await this.repository.markAsRead(id, userId);
    }
    async markAllAsRead(userId) {
        await this.repository.markAllAsRead(userId);
    }
    async getPreferences(userId) {
        let prefs = await this.repository.findPreferences(userId);
        if (!prefs) {
            prefs = await this.repository.createPreferences(userId);
        }
        return prefs;
    }
    async updatePreferences(userId, data) {
        await this.getPreferences(userId); // Ensure they exist
        const updates = {};
        if (typeof data.emailOnView === 'boolean')
            updates.emailOnView = data.emailOnView;
        if (typeof data.emailOnEmailCapture === 'boolean')
            updates.emailOnEmailCapture = data.emailOnEmailCapture;
        if (typeof data.inAppNotifications === 'boolean')
            updates.inAppNotifications = data.inAppNotifications;
        await this.repository.updatePreferences(userId, updates);
        return this.repository.findPreferences(userId);
    }
}
