import { ShareRepository } from './share.repository.js';
import { DocumentsRepository } from '../documents/index.js';
import { NotificationsService } from '../notifications/index.js';
import { UsersRepository } from '../auth/index.js';
import { NotFoundError, UnauthorizedError } from '../../core/errors/AppError.js';
import { sendViewNotification } from '../../services/email.js';
export class ShareService {
    repository;
    documentsRepository;
    notificationsService;
    usersRepository;
    constructor() {
        this.repository = new ShareRepository();
        this.documentsRepository = new DocumentsRepository();
        this.notificationsService = new NotificationsService();
        this.usersRepository = new UsersRepository();
    }
    async getMetadata(slug) {
        const doc = await this.repository.findBySlug(slug);
        if (!doc || !doc.isActive)
            throw new NotFoundError('Document not found');
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
    async verifyPassword(slug, password) {
        const doc = await this.repository.findBySlug(slug);
        if (!doc)
            throw new NotFoundError('Not found');
        if (password === doc.password)
            return true;
        throw new UnauthorizedError('Incorrect password');
    }
    async submitEmail(slug, email) {
        const doc = await this.repository.findBySlug(slug);
        if (!doc)
            throw new NotFoundError('Not found');
        const prefs = await this.notificationsService.getPreferences(doc.userId);
        if (!prefs || prefs.emailOnEmailCapture) {
            // Implement in-app notification for lead capture
            // We'll need a way to create notifications without a current user context
            // I'll add a method to NotificationsRepository for this
        }
        return true;
    }
    async startView(input, ip, userAgent, referrer) {
        const doc = await this.documentsRepository.findById(input.documentId);
        if (!doc)
            throw new NotFoundError('Document not found');
        const view = await this.repository.createView({
            documentId: input.documentId,
            viewerEmail: input.viewerEmail || null,
            viewerIp: ip,
            userAgent,
            totalPages: input.totalPages || 0,
            referrer,
        });
        // Notify owner
        this.notifyOwner(doc, input.viewerEmail || null, ip);
        return view.id;
    }
    async notifyOwner(doc, viewerEmail, viewerIp) {
        try {
            const owner = await this.usersRepository.findById(doc.userId);
            if (!owner)
                return;
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
                }).catch(() => { });
            }
        }
        catch (err) {
            console.error('[Notification Error]', err);
        }
    }
    async trackPage(input) {
        await this.repository.addPageEvent({
            viewId: input.viewId,
            pageNumber: input.pageNumber,
            timeSpent: input.timeSpent || 0,
        });
        await this.repository.updateViewStats(input.viewId);
    }
}
// Internal error class for simple BadRequest
class BadRequestError extends Error {
    constructor(msg) {
        super(msg);
        this.name = 'BadRequestError';
    }
}
