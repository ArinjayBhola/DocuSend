import { AnalyticsService } from './analytics.service.js';
export class AnalyticsController {
    service;
    constructor() {
        this.service = new AnalyticsService();
    }
    getDocumentAnalytics = async (req, res) => {
        const id = parseInt(req.params.id);
        const result = await this.service.getDocumentAnalytics(id, req.userId);
        res.json(result);
    };
}
