import { DealsRepository } from './deals.repository.js';
import { NotFoundError } from '../../core/errors/AppError.js';
export class StakeholderService {
    repository;
    constructor() {
        this.repository = new DealsRepository();
    }
    async addStakeholder(dealId, userId, input) {
        const deal = await this.repository.findByIdAndUser(dealId, userId);
        if (!deal)
            throw new NotFoundError('Deal not found');
        const stakeholder = await this.repository.addStakeholder({
            dealId,
            name: input.name,
            email: input.email,
            role: input.role || 'influencer',
            addedManually: true,
        });
        await this.repository.addActivity({
            dealId,
            type: 'stakeholder_added',
            description: `${input.name} (${input.role || 'influencer'}) added to deal`,
            metadata: JSON.stringify({ stakeholderId: stakeholder.id, email: input.email }),
        });
        return stakeholder;
    }
    async detectStakeholders(dealId, userId) {
        const deal = await this.repository.findByIdAndUser(dealId, userId);
        if (!deal)
            throw new NotFoundError('Deal not found');
        const wsDocs = await this.repository.getWorkspaceDocuments(deal.workspaceId, userId);
        const docIds = wsDocs.map((d) => d.documentId);
        if (!docIds.length)
            return { detected: 0, stakeholders: [] };
        const views = await this.repository.getViewsForDocuments(docIds);
        const emailSet = new Set();
        for (const v of views) {
            if (v.viewerEmail)
                emailSet.add(v.viewerEmail.toLowerCase());
        }
        const existingStakeholders = await this.repository.getStakeholders(dealId);
        const existingEmails = new Set(existingStakeholders.map((s) => s.email.toLowerCase()));
        const newStakeholders = [];
        for (const email of emailSet) {
            if (!existingEmails.has(email)) {
                const name = email
                    .split('@')[0]
                    .replace(/[._-]/g, ' ')
                    .replace(/\b\w/g, (c) => c.toUpperCase());
                const result = await this.repository.addStakeholder({
                    dealId,
                    name,
                    email,
                    role: 'influencer',
                    addedManually: false,
                });
                newStakeholders.push(result);
                await this.repository.addActivity({
                    dealId,
                    type: 'stakeholder_added',
                    description: `${name} auto-detected from document views`,
                    metadata: JSON.stringify({ stakeholderId: result.id, email, autoDetected: true }),
                });
            }
        }
        return { detected: newStakeholders.length, stakeholders: newStakeholders };
    }
}
