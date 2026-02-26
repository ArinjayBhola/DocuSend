import { ShareRepository } from './share.repository.js';
import { DocumentsRepository } from '../documents/index.js';
import { NotificationsService } from '../notifications/index.js';
import { AuthRepository } from '../auth/index.js';
import { SmartLinksService } from '../smartlinks/index.js';
import { PublicDocMetadata, ViewStartInput, PageEventInput } from './share.types.js';
import { NotFoundError, UnauthorizedError, BadRequestError } from '../../core/errors/AppError.js';
import { sendViewNotification } from '../../services/email.js';

export class ShareService {
  private repository: ShareRepository;
  private documentsRepository: DocumentsRepository;
  private notificationsService: NotificationsService;
  private usersRepository: AuthRepository;
  private smartLinksService: SmartLinksService;

  constructor() {
    this.repository = new ShareRepository();
    this.documentsRepository = new DocumentsRepository();
    this.notificationsService = new NotificationsService();
    this.usersRepository = new AuthRepository();
    this.smartLinksService = new SmartLinksService();
  }

  async getMetadata(slug: string): Promise<PublicDocMetadata> {
    // Check if this is a smart link slug (prefixed with sl_)
    if (slug.startsWith('sl_')) {
      return this.getSmartLinkMetadata(slug);
    }

    const doc = await this.repository.findBySlug(slug);
    if (!doc || !doc.isActive) throw new NotFoundError('Document not found');

    if (doc.expiresAt && new Date(doc.expiresAt) < new Date()) {
      throw new BadRequestError('Document has expired');
    }

    return {
      id: doc.id,
      title: doc.title,
      fileName: doc.fileName,
      shareSlug: doc.shareSlug,
      allowDownload: doc.allowDownload,
      requiresPassword: !!doc.password,
      requiresEmail: !!doc.requireEmail,
    };
  }

  private async getSmartLinkMetadata(slug: string): Promise<PublicDocMetadata> {
    const result = await this.smartLinksService.resolveSmartLink(slug);
    if (!result) throw new NotFoundError('Document not found');

    const { link, document: doc } = result;

    return {
      id: doc.id,
      title: doc.title,
      fileName: doc.fileName,
      shareSlug: slug,
      allowDownload: link.allowDownload,
      requiresPassword: link.requirePassword,
      requiresEmail: false, // Smart links already know the recipient
      smartLinkId: link.id,
      recipientEmail: link.recipientEmail,
      recipientName: link.recipientName || undefined,
    };
  }

  async verifyPassword(slug: string, password?: string) {
    // Handle smart link password verification
    if (slug.startsWith('sl_')) {
      const { SmartLinksRepository } = await import('../smartlinks/index.js');
      const repo = new SmartLinksRepository();
      const link = await repo.findBySlug(slug);
      if (!link) throw new NotFoundError('Not found');
      if (password === link.password) return true;
      throw new UnauthorizedError('Incorrect password');
    }

    const doc = await this.repository.findBySlug(slug);
    if (!doc) throw new NotFoundError('Not found');

    if (password === doc.password) return true;
    throw new UnauthorizedError('Incorrect password');
  }

  async submitEmail(slug: string, email: string) {
    const doc = await this.repository.findBySlug(slug);
    if (!doc) throw new NotFoundError('Not found');

    const prefs = await this.notificationsService.getPreferences(doc.userId);
    if (!prefs || prefs.emailOnEmailCapture) {
        // Implement in-app notification for lead capture
        // We'll need a way to create notifications without a current user context
        // I'll add a method to NotificationsRepository for this
    }

    return true;
  }

  async startView(input: ViewStartInput, ip: string, userAgent: string, referrer: string) {
    const doc = await this.documentsRepository.findById(input.documentId);
    if (!doc) throw new NotFoundError('Document not found');

    const view = await this.repository.createView({
      documentId: input.documentId,
      viewerEmail: input.viewerEmail || null,
      smartLinkId: input.smartLinkId || null,
      viewerIp: ip,
      userAgent,
      totalPages: input.totalPages || 0,
      referrer,
    });

    // Increment smart link view count on actual view start (not on metadata fetch)
    if (input.smartLinkId) {
      this.smartLinksService.recordView(input.smartLinkId).catch(() => {});
    }

    // Notify owner
    this.notifyOwner(doc, input.viewerEmail || null, ip);

    return view.id;
  }

  private async notifyOwner(doc: any, viewerEmail: string | null, viewerIp: string) {
    try {
      const owner = await this.usersRepository.findById(doc.userId);
      if (!owner) return;

      const prefs = await this.notificationsService.getPreferences(doc.userId);
      const shouldNotifyInApp = !prefs || prefs.inAppNotifications;
      const shouldNotifyEmail = !prefs || prefs.emailOnView;

      if (shouldNotifyInApp) {
        const viewer = viewerEmail || viewerIp || 'Someone';
        // Need to implement createNotification in repo or service
      }

      if (shouldNotifyEmail) {
        sendViewNotification({
          ownerEmail: owner.email,
          documentTitle: doc.title,
          viewerEmail,
          viewerIp,
        }).catch(() => {});
      }
    } catch (err) {
      console.error('[Notification Error]', err);
    }
  }

  async trackPage(input: PageEventInput) {
    await this.repository.addPageEvent({
      viewId: input.viewId,
      pageNumber: input.pageNumber,
      timeSpent: input.timeSpent || 0,
    });
    await this.repository.updateViewStats(input.viewId);
  }
}

