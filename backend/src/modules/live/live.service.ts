import { LiveRepository } from './live.repository.js';
import { DocumentsRepository } from '../documents/index.js';
import { liveSessionManager } from './live-session.manager.js';
import { ViewerEngagement, DocumentPerformance, LiveSummary } from './live.types.js';
import { NotFoundError } from '../../core/errors/AppError.js';

export class LiveService {
  private repository: LiveRepository;
  private documentsRepository: DocumentsRepository;

  constructor() {
    this.repository = new LiveRepository();
    this.documentsRepository = new DocumentsRepository();
  }

  async startSession(documentId: number, viewId: string, viewerEmail: string | null, viewerIp: string, totalPages: number) {
    const doc = await this.documentsRepository.findById(documentId);
    if (!doc) throw new NotFoundError('Document not found');

    liveSessionManager.addSession(viewId, {
      viewId,
      documentId,
      documentTitle: doc.title,
      userId: doc.userId,
      viewerEmail,
      viewerIp,
      currentPage: 1,
      totalPages: totalPages || 0,
      startedAt: Date.now(),
      lastActivity: Date.now(),
      pagesVisited: new Set([1]),
      timeOnCurrentPage: 0,
    });
  }

  async updatePageChange(viewId: string, pageNumber: number) {
    liveSessionManager.updateSessionPage(viewId, pageNumber);
  }

  async endSession(viewId: string) {
    liveSessionManager.endSession(viewId);
  }

  async getEngagement(userId: number) {
    const recentViews = await this.repository.getRecentViews(userId);

    const viewerScores: Record<string, ViewerEngagement> = {};

    for (const view of recentViews) {
      const key = view.viewerEmail || view.viewerIp || 'unknown';
      if (!viewerScores[key]) {
        viewerScores[key] = {
          identifier: key,
          isEmail: !!view.viewerEmail,
          email: view.viewerEmail,
          visits: 0,
          totalDuration: 0,
          maxCompletionRate: 0,
          lastVisit: view.viewedAt,
          firstVisit: view.viewedAt,
          score: 0,
          tier: 'cold',
          documentsCount: 0,
        };
      }

      const scorer = viewerScores[key];
      scorer.visits += 1;
      scorer.totalDuration += Number(view.duration) || 0;
      
      const completion = (view.totalPages || 0) > 0 ? (Number(view.pagesViewed) || 0) / Number(view.totalPages) : 0;
      scorer.maxCompletionRate = Math.max(scorer.maxCompletionRate, completion);

      if (view.viewedAt > scorer.lastVisit) scorer.lastVisit = view.viewedAt;
      if (view.viewedAt < scorer.firstVisit) scorer.firstVisit = view.viewedAt;
    }

    // Scoring logic (same as original)
    for (const scorer of Object.values(viewerScores)) {
      const timeScore = Math.min(25, (scorer.totalDuration / 600) * 25);
      const completionScore = scorer.maxCompletionRate * 25;
      const visitScore = Math.min(25, (scorer.visits / 5) * 25);
      const daysSinceLastVisit = (Date.now() - new Date(scorer.lastVisit).getTime()) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.max(0, 25 - (daysSinceLastVisit / 30) * 25);

      scorer.score = Math.round(timeScore + completionScore + visitScore + recencyScore);
      scorer.tier = scorer.score >= 70 ? 'hot' : scorer.score >= 40 ? 'warm' : 'cold';
    }

    const scoredViewers = Object.values(viewerScores).sort((a, b) => b.score - a.score);

    // Document Performance logic
    const docPerformance: Record<number, any> = {};
    for (const view of recentViews) {
      if (!docPerformance[view.documentId]) {
        docPerformance[view.documentId] = {
          documentId: view.documentId,
          title: view.documentTitle,
          totalViews: 0,
          uniqueViewers: new Set(),
          totalDuration: 0,
          completionSum: 0,
        };
      }
      const perf = docPerformance[view.documentId];
      perf.totalViews += 1;
      perf.uniqueViewers.add(view.viewerEmail || view.viewerIp);
      perf.totalDuration += Number(view.duration) || 0;
      const completion = (view.totalPages || 0) > 0 ? (Number(view.pagesViewed) || 0) / Number(view.totalPages) : 0;
      perf.completionSum += completion;
    }

    const docRankings: DocumentPerformance[] = Object.values(docPerformance)
      .map((d) => ({
        documentId: d.documentId,
        title: d.title,
        totalViews: d.totalViews,
        uniqueViewers: d.uniqueViewers.size,
        avgDuration: d.totalViews > 0 ? Math.round(d.totalDuration / d.totalViews) : 0,
        avgCompletion: d.totalViews > 0 ? Math.round((d.completionSum / d.totalViews) * 100) : 0,
        engagementScore: Math.round(
          d.totalViews * 2 +
            d.uniqueViewers.size * 10 +
            d.totalDuration / 60 +
            (d.completionSum / Math.max(d.totalViews, 1)) * 50
        ),
      }))
      .sort((a, b) => b.engagementScore - a.engagementScore);

    const hotLeads = scoredViewers.filter((v) => v.tier === 'hot').length;
    const warmLeads = scoredViewers.filter((v) => v.tier === 'warm').length;
    const coldLeads = scoredViewers.filter((v) => v.tier === 'cold').length;

    const summary: LiveSummary = {
      totalViewers: scoredViewers.length,
      hotLeads,
      warmLeads,
      coldLeads,
      activeSessions: liveSessionManager.getActiveCount(userId),
      totalViews30d: recentViews.length,
    };

    return {
      summary,
      viewers: scoredViewers.slice(0, 50),
      documentRankings: docRankings.slice(0, 20),
    };
  }
}
