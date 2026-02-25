import { DealsRepository } from './deals.repository.js';
import { DealAnalyticsService } from './deal-analytics.service.js';
import { CreateDealInput, UpdateDealInput, Deal } from './deals.types.js';
import { NotFoundError, BadRequestError } from '../../core/errors/AppError.js';

export class DealsService {
  private repository: DealsRepository;
  private analytics: DealAnalyticsService;

  constructor() {
    this.repository = new DealsRepository();
    this.analytics = new DealAnalyticsService();
  }

  async getAllDeals(userId: number) {
    const deals = await this.repository.findAllByUser(userId);
    const result = await Promise.all(deals.map(async (deal) => {
      const stakeholderCount = await this.repository.getStakeholderCount(deal.id);
      return { ...deal, stakeholderCount };
    }));
    return result;
  }

  async createDeal(userId: number, input: CreateDealInput) {
    const existing = await this.repository.findByWorkspaceId(input.workspaceId, userId);
    if (existing) {
      throw new BadRequestError('This workspace already has a deal linked');
    }

    const now = new Date().toISOString();
    const result = await this.repository.create({
      userId,
      workspaceId: input.workspaceId,
      accountName: input.accountName,
      stage: input.stage || 'prospecting',
      value: input.value || 0,
      currency: input.currency || 'USD',
      closeDate: input.closeDate || null,
      stageEnteredAt: now,
      healthStatus: 'healthy',
      createdAt: now,
      updatedAt: now,
    });

    await this.repository.addActivity({
      dealId: result.id,
      type: 'stage_change',
      description: `Deal created in ${result.stage} stage`,
    });

    return result;
  }

  async getDealDetail(id: number, userId: number) {
    const deal = await this.repository.findByIdAndUser(id, userId);
    if (!deal) throw new NotFoundError('Deal not found');

    const dealStakeholders = await this.repository.getStakeholders(deal.id);
    const wsDocs = await this.repository.getWorkspaceDocuments(deal.workspaceId, userId);
    const docIds = wsDocs.map((d) => d.documentId);
    const views = await this.repository.getViewsForDocuments(docIds);

    const daysInStage = Math.floor((Date.now() - new Date(deal.stageEnteredAt).getTime()) / (1000 * 60 * 60 * 24));

    return {
      deal,
      stakeholders: dealStakeholders,
      stats: {
        totalDocuments: wsDocs.length,
        totalViews: views.length,
        totalDuration: views.reduce((sum, v) => sum + (Number(v.duration) || 0), 0),
        daysInStage,
      },
    };
  }

  async updateDeal(id: number, userId: number, input: UpdateDealInput) {
    const deal = await this.repository.findByIdAndUser(id, userId);
    if (!deal) throw new NotFoundError('Deal not found');

    const now = new Date().toISOString();
    const updates: Partial<Deal> = { updatedAt: now };

    if (input.accountName !== undefined) updates.accountName = input.accountName;
    if (input.value !== undefined) updates.value = input.value;
    if (input.currency !== undefined) updates.currency = input.currency;
    if (input.closeDate !== undefined) updates.closeDate = input.closeDate;

    if (input.stage && input.stage !== deal.stage) {
      updates.stage = input.stage;
      updates.stageEnteredAt = now;
      await this.repository.addActivity({
        dealId: deal.id,
        type: 'stage_change',
        description: `Stage changed from ${deal.stage} to ${input.stage}`,
        metadata: JSON.stringify({ from: deal.stage, to: input.stage }),
      });
    }

    await this.repository.update(id, updates);
    return this.repository.findByIdAndUser(id, userId);
  }

  async assessRisk(id: number, userId: number) {
    const deal = await this.repository.findByIdAndUser(id, userId);
    if (!deal) throw new NotFoundError('Deal not found');

    const stakeholders = await this.repository.getStakeholders(deal.id);
    const wsDocs = await this.repository.getWorkspaceDocuments(deal.workspaceId, userId);
    const docIds = wsDocs.map((d) => d.documentId);
    const allViews = await this.repository.getViewsForDocuments(docIds);

    const assessment = await this.analytics.assessRisk(deal, stakeholders, allViews);
    
    // Cache health status
    await this.repository.update(id, { 
      healthStatus: assessment.healthStatus, 
      updatedAt: new Date().toISOString() 
    });

    return assessment;
  }

  async getIntentGraph(id: number, userId: number) {
    const deal = await this.repository.findByIdAndUser(id, userId);
    if (!deal) throw new NotFoundError('Deal not found');

    const stakeholders = await this.repository.getStakeholders(deal.id);
    const wsDocs = await this.repository.getWorkspaceDocuments(deal.workspaceId, userId);
    const docIds = wsDocs.map((d) => d.documentId);
    const views = await this.repository.getViewsForDocuments(docIds);

    return this.analytics.computeIntentGraph(stakeholders, wsDocs, views);
  }

  async getActions(id: number, userId: number) {
    const deal = await this.repository.findByIdAndUser(id, userId);
    if (!deal) throw new NotFoundError('Deal not found');

    const stakeholders = await this.repository.getStakeholders(deal.id);
    const wsDocs = await this.repository.getWorkspaceDocuments(deal.workspaceId, userId);
    const docIds = wsDocs.map((d) => d.documentId);
    const allViews = await this.repository.getViewsForDocuments(docIds);

    return this.analytics.computeActions(deal, stakeholders, allViews);
  }

  async delete(id: number, userId: number) {
    const deal = await this.repository.findByIdAndUser(id, userId);
    if (!deal) throw new NotFoundError('Deal not found');
    await this.repository.delete(id);
  }
}
