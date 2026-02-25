import { LeadsService } from './leads.service.js';
export class LeadsController {
    service;
    constructor() {
        this.service = new LeadsService();
    }
    list = async (req, res) => {
        const result = await this.service.getAggregatedLeads(req.userId);
        res.json(result);
    };
    export = async (req, res) => {
        const leads = await this.service.getRawLeads(req.userId);
        const csv = this.service.formatCSV(leads);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=docusend-leads.csv');
        res.send(csv);
    };
}
