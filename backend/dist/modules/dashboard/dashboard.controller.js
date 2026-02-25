import { DashboardService } from './dashboard.service.js';
export class DashboardController {
    service;
    constructor() {
        this.service = new DashboardService();
    }
    getSummary = async (req, res) => {
        // req.user is loaded by loadUser middleware
        const result = await this.service.getDashboardSummary(req.userId, req.user.plan);
        res.json(result);
    };
}
