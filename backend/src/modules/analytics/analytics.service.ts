import { AnalyticsRepository } from './analytics.repository.js';
import { DocumentsRepository } from '../documents/index.js';
import { DocumentAnalyticsResult } from './analytics.types.js';
import { NotFoundError } from '../../core/errors/AppError.js';

export class AnalyticsService {
  private repository: AnalyticsRepository;
  private documentsRepository: DocumentsRepository;

  constructor() {
    this.repository = new AnalyticsRepository();
    this.documentsRepository = new DocumentsRepository();
  }

  async getDocumentAnalytics(documentId: number, userId: number): Promise<DocumentAnalyticsResult> {
    const doc = await this.documentsRepository.findByIdAndUser(documentId, userId);
    if (!doc) throw new NotFoundError('Document not found');

    const [stats, viewers, pageHeatmap, viewTimeline] = await Promise.all([
      this.repository.getDocumentStats(documentId),
      this.repository.getRecentViewers(documentId),
      this.repository.getPageHeatmap(documentId),
      this.repository.getViewTimeline(documentId),
    ]);

    return {
      document: doc,
      stats,
      viewers,
      pageHeatmap,
      viewTimeline,
    };
  }
}
