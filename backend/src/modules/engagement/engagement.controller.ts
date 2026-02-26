import { Request, Response } from 'express';
import { EngagementService } from './engagement.service.js';
import {
  scoresQuerySchema,
  documentScoresParamsSchema,
  followUpsQuerySchema,
  documentPerformanceQuerySchema,
} from './engagement.validation.js';

export class EngagementController {
  private service: EngagementService;

  constructor() {
    this.service = new EngagementService();
  }

  getScores = async (req: Request, res: Response) => {
    const query = scoresQuerySchema.parse(req.query);
    let scores = await this.service.getScoresForUser(req.userId!);

    if (query.classification) {
      scores = scores.filter((s) => s.classification === query.classification);
    }

    if (query.sortBy === 'recency') {
      scores.sort((a, b) => new Date(b.lastViewedAt).getTime() - new Date(a.lastViewedAt).getTime());
    } else if (query.sortBy === 'time') {
      scores.sort((a, b) => b.totalTimeSpent - a.totalTimeSpent);
    }

    const total = scores.length;
    const paginated = scores.slice(query.offset, query.offset + query.limit);

    res.json({ scores: paginated, total });
  };

  getDocumentScores = async (req: Request, res: Response) => {
    const { documentId } = documentScoresParamsSchema.parse(req.params);
    const scores = await this.service.getScoresForDocument(req.userId!, documentId);
    res.json({ scores, total: scores.length });
  };

  getFollowUps = async (req: Request, res: Response) => {
    const query = followUpsQuerySchema.parse(req.query);
    let suggestions = await this.service.getFollowUpSuggestions(req.userId!);

    if (query.priority) {
      suggestions = suggestions.filter((s) => s.priority === query.priority);
    }

    res.json({ suggestions: suggestions.slice(0, query.limit), total: suggestions.length });
  };

  getDocumentPerformance = async (req: Request, res: Response) => {
    const query = documentPerformanceQuerySchema.parse(req.query);
    let performance = await this.service.getDocumentPerformance(req.userId!);

    if (query.sortBy === 'viewers') {
      performance.sort((a, b) => b.totalViewers - a.totalViewers);
    } else if (query.sortBy === 'completionRate') {
      performance.sort((a, b) => b.completionRate - a.completionRate);
    }

    res.json({ documents: performance.slice(0, query.limit), total: performance.length });
  };
}
