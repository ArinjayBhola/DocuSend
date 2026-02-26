import { SmartLinksRepository } from './smartlinks.repository.js';
import { DocumentsRepository } from '../documents/index.js';
import { CreateSmartLinkInput, UpdateSmartLinkInput, SmartLink, SmartLinkWithAnalytics } from './smartlinks.types.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../core/errors/AppError.js';
import { generateSlug } from '../../utils/helpers.js';
import { getPlanLimits } from '../billing/index.js';

export class SmartLinksService {
  private repository: SmartLinksRepository;
  private documentsRepository: DocumentsRepository;

  constructor() {
    this.repository = new SmartLinksRepository();
    this.documentsRepository = new DocumentsRepository();
  }

  async create(userId: number, userPlan: string, input: CreateSmartLinkInput): Promise<SmartLink> {
    // Verify document belongs to user
    const doc = await this.documentsRepository.findByIdAndUser(input.documentId, userId);
    if (!doc) throw new NotFoundError('Document not found');

    // Check plan limits
    const limits = getPlanLimits(userPlan);
    if (limits.smartLinks !== Infinity) {
      const count = await this.repository.countByUser(userId);
      if (count >= limits.smartLinks) {
        throw new ForbiddenError(
          `You've reached the ${limits.smartLinks} smart link limit on the ${userPlan} plan. Upgrade to create more.`
        );
      }
    }

    const slug = `sl_${generateSlug(12)}`;

    const link = await this.repository.create({
      userId,
      documentId: input.documentId,
      slug,
      recipientEmail: input.recipientEmail,
      recipientName: input.recipientName || null,
      allowDownload: input.allowDownload ?? false,
      requirePassword: input.requirePassword ?? false,
      password: input.password || null,
      expiresAt: input.expiresAt || null,
      maxViews: input.maxViews || null,
    });

    return link;
  }

  async list(userId: number, documentId?: number): Promise<SmartLinkWithAnalytics[]> {
    return this.repository.findAllByUser(userId, documentId);
  }

  async getOne(id: number, userId: number) {
    const link = await this.repository.findByIdAndUser(id, userId);
    if (!link) throw new NotFoundError('Smart link not found');

    const views = await this.repository.getViewsForLink(id);
    const doc = await this.documentsRepository.findById(link.documentId);

    return {
      ...link,
      documentTitle: doc?.title || 'Unknown',
      views,
    };
  }

  async update(id: number, userId: number, input: UpdateSmartLinkInput): Promise<SmartLink> {
    const link = await this.repository.findByIdAndUser(id, userId);
    if (!link) throw new NotFoundError('Smart link not found');

    await this.repository.update(id, {
      recipientName: input.recipientName !== undefined ? input.recipientName : link.recipientName,
      allowDownload: input.allowDownload !== undefined ? input.allowDownload : link.allowDownload,
      requirePassword: input.requirePassword !== undefined ? input.requirePassword : link.requirePassword,
      password: input.password !== undefined ? input.password : link.password,
      expiresAt: input.expiresAt !== undefined ? input.expiresAt : link.expiresAt,
      isActive: input.isActive !== undefined ? input.isActive : link.isActive,
      maxViews: input.maxViews !== undefined ? input.maxViews : link.maxViews,
    });

    return (await this.repository.findById(id))!;
  }

  async remove(id: number, userId: number): Promise<void> {
    const link = await this.repository.findByIdAndUser(id, userId);
    if (!link) throw new NotFoundError('Smart link not found');
    await this.repository.delete(id);
  }

  async duplicate(id: number, userId: number, userPlan: string): Promise<SmartLink> {
    const link = await this.repository.findByIdAndUser(id, userId);
    if (!link) throw new NotFoundError('Smart link not found');

    return this.create(userId, userPlan, {
      documentId: link.documentId,
      recipientEmail: link.recipientEmail,
      recipientName: link.recipientName || undefined,
      allowDownload: link.allowDownload,
      requirePassword: link.requirePassword,
      password: link.password || undefined,
      expiresAt: link.expiresAt || undefined,
      maxViews: link.maxViews || undefined,
    });
  }

  /**
   * Resolve a smart link slug for the share viewer (metadata only, no view count increment).
   * Returns the document + smart link info, or null if not a smart link slug.
   */
  async resolveSmartLink(slug: string) {
    const link = await this.repository.findBySlug(slug);
    if (!link) return null;

    if (!link.isActive) {
      throw new BadRequestError('This link has been revoked');
    }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      throw new BadRequestError('This link has expired');
    }

    if (link.maxViews && link.viewCount >= link.maxViews) {
      throw new BadRequestError('This link has reached its view limit');
    }

    const doc = await this.documentsRepository.findById(link.documentId);
    if (!doc || !doc.isActive) {
      throw new NotFoundError('Document not found');
    }

    return { link, document: doc };
  }

  /**
   * Record a view for a smart link (called when startView is triggered, not on metadata fetch).
   */
  async recordView(linkId: number) {
    await this.repository.incrementViewCount(linkId);
  }
}
