import { Request, Response } from 'express';
import { LeadsService } from './leads.service.js';

export class LeadsController {
  private service: LeadsService;

  constructor() {
    this.service = new LeadsService();
  }

  list = async (req: Request, res: Response) => {
    const result = await this.service.getAggregatedLeads(req.userId!);
    res.json(result);
  };

  export = async (req: Request, res: Response) => {
    const leads = await this.service.getRawLeads(req.userId!);
    const csv = this.service.formatCSV(leads);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=docusend-leads.csv');
    res.send(csv);
  };
}
