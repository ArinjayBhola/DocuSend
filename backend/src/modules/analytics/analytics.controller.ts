import { Request, Response } from 'express';
import { AnalyticsService } from './analytics.service.js';

export class AnalyticsController {
  private service: AnalyticsService;

  constructor() {
    this.service = new AnalyticsService();
  }

  getDocumentAnalytics = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    const result = await this.service.getDocumentAnalytics(id, req.userId!);
    res.json(result);
  };
}
