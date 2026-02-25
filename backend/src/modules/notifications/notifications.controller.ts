import { Request, Response } from 'express';
import { NotificationsService } from './notifications.service.js';

export class NotificationsController {
  private service: NotificationsService;

  constructor() {
    this.service = new NotificationsService();
  }

  list = async (req: Request, res: Response) => {
    const result = await this.service.getNotifications(req.userId!);
    res.json(result);
  };

  unreadCount = async (req: Request, res: Response) => {
    const count = await this.service.getUnreadCount(req.userId!);
    res.json({ unreadCount: count });
  };

  markRead = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    await this.service.markAsRead(id, req.userId!);
    res.json({ ok: true });
  };

  markAllRead = async (req: Request, res: Response) => {
    await this.service.markAllAsRead(req.userId!);
    res.json({ ok: true });
  };

  getPreferences = async (req: Request, res: Response) => {
    const preferences = await this.service.getPreferences(req.userId!);
    res.json({ preferences });
  };

  updatePreferences = async (req: Request, res: Response) => {
    const updated = await this.service.updatePreferences(req.userId!, req.body);
    res.json({ preferences: updated });
  };
}
