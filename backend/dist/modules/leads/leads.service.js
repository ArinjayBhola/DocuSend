import { LeadsRepository } from './leads.repository.js';
export class LeadsService {
    repository;
    constructor() {
        this.repository = new LeadsRepository();
    }
    async getAggregatedLeads(userId) {
        const rawLeads = await this.repository.findLeadsByUser(userId);
        const uniqueLeads = {};
        for (const lead of rawLeads) {
            if (!uniqueLeads[lead.email]) {
                uniqueLeads[lead.email] = {
                    email: lead.email,
                    totalViews: 0,
                    totalDuration: 0,
                    documents: [],
                    firstSeen: lead.firstViewedAt,
                    lastSeen: lead.lastViewedAt,
                };
            }
            const entry = uniqueLeads[lead.email];
            entry.totalViews += Number(lead.viewCount) || 0;
            entry.totalDuration += Number(lead.totalDuration) || 0;
            entry.documents.push({
                id: lead.documentId,
                title: lead.documentTitle,
                shareSlug: lead.shareSlug,
                viewCount: Number(lead.viewCount) || 0,
                avgPagesViewed: Number(lead.avgPagesViewed) || 0,
                lastViewedAt: lead.lastViewedAt,
            });
            if (lead.firstViewedAt < entry.firstSeen)
                entry.firstSeen = lead.firstViewedAt;
            if (lead.lastViewedAt > entry.lastSeen)
                entry.lastSeen = lead.lastViewedAt;
        }
        const result = Object.values(uniqueLeads);
        return {
            leads: result,
            totalLeads: result.length,
            totalViews: result.reduce((sum, l) => sum + l.totalViews, 0),
        };
    }
    formatCSV(leads) {
        const header = 'Email,Document,Views,Total Duration (s),First Viewed,Last Viewed\n';
        const escapeCSV = (val) => {
            if (val === null || val === undefined)
                return '""';
            const str = String(val);
            return `"${str.replace(/"/g, '""')}"`;
        };
        const rows = leads
            .map((l) => `${escapeCSV(l.email)},${escapeCSV(l.documentTitle)},${Number(l.viewCount) || 0},${Number(l.totalDuration) || 0},${escapeCSV(l.firstViewedAt)},${escapeCSV(l.lastViewedAt)}`)
            .join('\n');
        return header + rows;
    }
    async getRawLeads(userId) {
        return this.repository.findLeadsByUser(userId);
    }
}
