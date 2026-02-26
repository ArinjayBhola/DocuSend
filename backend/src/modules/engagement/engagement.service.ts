import { EngagementRepository } from "./engagement.repository.js";
import {
  EngagementScore,
  FollowUpSuggestion,
  DocumentPerformance,
  ViewerRawData,
  LeadClassification,
  FollowUpPriority,
} from "./engagement.types.js";

export class EngagementService {
  private repository: EngagementRepository;

  // Scoring weights
  private readonly TIME_WEIGHT = 0.3;
  private readonly COMPLETION_WEIGHT = 0.25;
  private readonly FREQUENCY_WEIGHT = 0.2;
  private readonly RECENCY_WEIGHT = 0.15;
  private readonly DEPTH_WEIGHT = 0.1;

  // Expected read time per page (seconds)
  private readonly EXPECTED_TIME_PER_PAGE = 60;
  // Recency half-life in days
  private readonly RECENCY_HALF_LIFE = 7;

  constructor() {
    this.repository = new EngagementRepository();
  }

  // ─── Scoring Algorithm ───────────────────────────────────────────

  private computeScore(viewer: ViewerRawData, maxVisits: number): EngagementScore {
    const expectedReadTime = viewer.totalPages * this.EXPECTED_TIME_PER_PAGE;

    // Time score: how much time they spent vs expected
    const timeRatio = expectedReadTime > 0 ? viewer.totalDuration / expectedReadTime : 0;
    const timeScore = Math.min(timeRatio, 1) * 100;

    // Completion score: % of pages viewed
    const completionRatio = viewer.totalPages > 0 ? viewer.totalPagesViewed / viewer.totalPages : 0;
    const completionScore = Math.min(completionRatio, 1) * 100;

    // Frequency score: log-normalized visit count
    const frequencyScore =
      maxVisits > 0
        ? (Math.log2(viewer.visitCount + 1) / Math.log2(maxVisits + 1)) * 100
        : viewer.visitCount > 0
          ? 100
          : 0;

    // Recency score: exponential decay from last visit
    const daysSinceLastView = this.daysSince(viewer.lastViewedAt);
    const recencyScore = Math.exp((-0.693 * daysSinceLastView) / this.RECENCY_HALF_LIFE) * 100;

    // Depth score: avg time per page (capped at expected time per page)
    const depthRatio = this.EXPECTED_TIME_PER_PAGE > 0 ? viewer.avgTimePerPage / this.EXPECTED_TIME_PER_PAGE : 0;
    const depthScore = Math.min(depthRatio, 1) * 100;

    // Weighted sum, clamped to 0-100
    const rawScore =
      timeScore * this.TIME_WEIGHT +
      completionScore * this.COMPLETION_WEIGHT +
      frequencyScore * this.FREQUENCY_WEIGHT +
      recencyScore * this.RECENCY_WEIGHT +
      depthScore * this.DEPTH_WEIGHT;

    const score = Math.round(Math.max(0, Math.min(100, rawScore)));

    return {
      viewerEmail: viewer.viewerEmail,
      documentId: viewer.documentId,
      documentTitle: viewer.documentTitle,
      score,
      classification: this.classify(score),
      timeScore: Math.round(timeScore),
      completionScore: Math.round(completionScore),
      frequencyScore: Math.round(frequencyScore),
      recencyScore: Math.round(recencyScore),
      depthScore: Math.round(depthScore),
      totalTimeSpent: viewer.totalDuration,
      pagesViewed: viewer.totalPagesViewed,
      totalPages: viewer.totalPages,
      visitCount: viewer.visitCount,
      lastViewedAt: viewer.lastViewedAt,
    };
  }

  private classify(score: number): LeadClassification {
    if (score >= 80) return "hot";
    if (score >= 50) return "warm";
    if (score >= 20) return "interested";
    return "cold";
  }

  private daysSince(dateStr: string): number {
    const now = new Date();
    const date = new Date(dateStr);
    return Math.max(0, (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  }

  // ─── Public: Scores ──────────────────────────────────────────────

  async getScoresForUser(userId: number): Promise<EngagementScore[]> {
    const viewers = await this.repository.getViewerDataForUser(userId);
    if (viewers.length === 0) return [];

    const maxVisits = Math.max(...viewers.map((v) => v.visitCount));
    return viewers.map((v) => this.computeScore(v, maxVisits)).sort((a, b) => b.score - a.score);
  }

  async getScoresForDocument(userId: number, documentId: number): Promise<EngagementScore[]> {
    const viewers = await this.repository.getViewerDataForDocument(userId, documentId);
    if (viewers.length === 0) return [];

    const maxVisits = Math.max(...viewers.map((v) => v.visitCount));
    return viewers.map((v) => this.computeScore(v, maxVisits)).sort((a, b) => b.score - a.score);
  }

  // ─── Public: Follow-Up Suggestions ──────────────────────────────

  async getFollowUpSuggestions(userId: number): Promise<FollowUpSuggestion[]> {
    const scores = await this.getScoresForUser(userId);
    const suggestions: FollowUpSuggestion[] = [];

    for (const s of scores) {
      const daysSince = this.daysSince(s.lastViewedAt);

      // Rule 1: Hot lead — reach out now
      if (s.classification === "hot" && daysSince < 3) {
        suggestions.push({
          viewerEmail: s.viewerEmail,
          documentId: s.documentId,
          documentTitle: s.documentTitle,
          priority: "high",
          action: "Reach out now",
          reason: `Hot lead — spent ${this.formatDuration(s.totalTimeSpent)} on "${s.documentTitle}" with ${s.score}/100 engagement score`,
          suggestedTiming: "Today",
          score: s.score,
          classification: s.classification,
        });
        continue;
      }

      // Rule 2: Viewed deeply but completion < 50%
      if (s.depthScore > 60 && s.completionScore < 50) {
        suggestions.push({
          viewerEmail: s.viewerEmail,
          documentId: s.documentId,
          documentTitle: s.documentTitle,
          priority: "medium",
          action: "Send a shorter summary",
          reason: `Only viewed ${Math.round((s.pagesViewed / s.totalPages) * 100)}% of "${s.documentTitle}" but read carefully — may need a condensed version`,
          suggestedTiming: "Within 2 days",
          score: s.score,
          classification: s.classification,
        });
        continue;
      }

      // Rule 3: Was hot/warm, going cold (last viewed 3-14 days ago)
      if (
        (s.classification === "warm" || s.classification === "interested") &&
        daysSince >= 3 &&
        daysSince <= 14 &&
        s.visitCount > 1
      ) {
        suggestions.push({
          viewerEmail: s.viewerEmail,
          documentId: s.documentId,
          documentTitle: s.documentTitle,
          priority: "high",
          action: "Re-engage before they go cold",
          reason: `Previously engaged (${s.visitCount} visits) but last viewed ${Math.round(daysSince)} days ago — declining engagement`,
          suggestedTiming: "Today",
          score: s.score,
          classification: s.classification,
        });
        continue;
      }

      // Rule 4: New hot lead (single recent visit with high score)
      if (s.classification === "hot" && s.visitCount === 1 && daysSince < 7) {
        suggestions.push({
          viewerEmail: s.viewerEmail,
          documentId: s.documentId,
          documentTitle: s.documentTitle,
          priority: "high",
          action: "New hot lead detected",
          reason: `First-time viewer scored ${s.score}/100 on "${s.documentTitle}" — high buying intent`,
          suggestedTiming: "Today",
          score: s.score,
          classification: s.classification,
        });
        continue;
      }

      // Rule 5: Warm lead, not contacted recently
      if (s.classification === "warm" && daysSince < 7) {
        suggestions.push({
          viewerEmail: s.viewerEmail,
          documentId: s.documentId,
          documentTitle: s.documentTitle,
          priority: "medium",
          action: "Send pricing follow-up",
          reason: `Warm lead with ${s.score}/100 score — ${s.visitCount} visit(s) to "${s.documentTitle}"`,
          suggestedTiming: "Within 3 days",
          score: s.score,
          classification: s.classification,
        });
        continue;
      }

      // Rule 6: Cold leads with some activity
      if (s.classification === "cold" && s.visitCount > 0 && daysSince > 14) {
        suggestions.push({
          viewerEmail: s.viewerEmail,
          documentId: s.documentId,
          documentTitle: s.documentTitle,
          priority: "low",
          action: "Send new materials",
          reason: `Last viewed "${s.documentTitle}" ${Math.round(daysSince)} days ago — consider re-engaging with fresh content`,
          suggestedTiming: "This week",
          score: s.score,
          classification: s.classification,
        });
      }
    }

    // Sort by priority (high first), then by score
    const priorityOrder: Record<FollowUpPriority, number> = { high: 0, medium: 1, low: 2 };
    return suggestions.sort((a, b) => {
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      return pDiff !== 0 ? pDiff : b.score - a.score;
    });
  }

  // ─── Public: Document Performance ───────────────────────────────

  async getDocumentPerformance(userId: number): Promise<DocumentPerformance[]> {
    const [docStats, allScores] = await Promise.all([
      this.repository.getDocumentStats(userId),
      this.getScoresForUser(userId),
    ]);

    return docStats
      .map((doc) => {
        const docScores = allScores.filter((s) => s.documentId === doc.documentId);
        const avgScore =
          docScores.length > 0 ? Math.round(docScores.reduce((sum, s) => sum + s.score, 0) / docScores.length) : 0;

        const avgTotalPages = Number(doc.avgTotalPages) || 1;
        const avgPagesViewed = Number(doc.avgPagesViewed) || 0;
        const completionRate = Math.round((avgPagesViewed / avgTotalPages) * 100);

        return {
          documentId: doc.documentId,
          title: doc.title,
          avgEngagementScore: avgScore,
          totalViewers: Number(doc.totalViewers),
          completionRate: Math.min(completionRate, 100),
          avgTimeSpent: Math.round(Number(doc.avgDuration)),
          hotLeads: docScores.filter((s) => s.classification === "hot").length,
          warmLeads: docScores.filter((s) => s.classification === "warm").length,
          interestedLeads: docScores.filter((s) => s.classification === "interested").length,
          coldLeads: docScores.filter((s) => s.classification === "cold").length,
          createdAt: doc.createdAt,
        };
      })
      .sort((a, b) => b.avgEngagementScore - a.avgEngagementScore);
  }

  // ─── Helpers ────────────────────────────────────────────────────

  private formatDuration(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  }
}
