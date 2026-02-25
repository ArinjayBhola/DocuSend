import { NotificationsService } from './notifications.service.js';
export class NotificationsController {
    service;
    constructor() {
        this.service = new NotificationsService();
    }
    list = async (req, res) => {
        const result = await this.service.getNotifications(req.userId);
        res.json(result);
    };
    unreadCount = async (req, res) => {
        const count = await this.service.getUnreadCount(req.userId);
        res.json({ unreadCount: count });
    };
    markRead = async (req, res) => {
        const id = parseInt(req.params.id);
        await this.service.markAsRead(id, req.userId);
        res.json({ ok: true });
    };
    markAllRead = async (req, res) => {
        await this.service.markAllAsRead(req.userId);
        res.json({ ok: true });
    };
    getPreferences = async (req, res) => {
        const preferences = await this.service.getPreferences(req.userId);
        res.json({ preferences });
    };
    updatePreferences = async (req, res) => {
        const updated = await this.service.updatePreferences(req.userId, req.body);
        res.json({ preferences: updated });
    };
}
