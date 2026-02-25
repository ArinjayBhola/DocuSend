import { Request, Response } from 'express';
import { DashboardService } from './dashboard.service.js';

export class DashboardController {
  private service: DashboardService;

  constructor() {
    this.service = new DashboardService();
  }

  getSummary = async (req: Request, res: Response) => {
    // req.user is loaded by loadUser middleware
    const result = await this.service.getDashboardSummary(req.userId!, req.user!.plan);
    res.json(result);
  };
}
