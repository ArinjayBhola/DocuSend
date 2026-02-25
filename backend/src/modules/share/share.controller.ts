import { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { ShareService } from './share.service.js';
import { DocumentsRepository } from '../documents/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class ShareController {
  private service: ShareService;
  private documentsRepository: DocumentsRepository;

  constructor() {
    this.service = new ShareService();
    this.documentsRepository = new DocumentsRepository();
  }

  getMetadata = async (req: Request, res: Response) => {
    const result = await this.service.getMetadata(req.params.slug as string);
    res.json({ document: result });
  };

  verifyPassword = async (req: Request, res: Response) => {
    await this.service.verifyPassword(req.params.slug as string, req.body.password);
    res.json({ ok: true });
  };

  submitEmail = async (req: Request, res: Response) => {
    await this.service.submitEmail(req.params.slug as string, req.body.email);
    res.json({ ok: true });
  };

  startView = async (req: Request, res: Response) => {
    const ip = (req.ip || req.headers['x-forwarded-for'] || 'unknown') as string;
    const userAgent = (req.headers['user-agent'] || '') as string;
    const referrer = (req.headers['referer'] || '') as string;

    const viewId = await this.service.startView(req.body, ip, userAgent, referrer);
    res.json({ viewId });
  };

  trackPage = async (req: Request, res: Response) => {
    await this.service.trackPage(req.body);
    res.json({ ok: true });
  };

  endView = async (req: Request, res: Response) => {
    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { return res.json({ ok: true }); }
    }
    if (body.viewId) {
        await this.service.trackPage(body); // endView in original code also tracks the last page event
    }
    res.json({ ok: true });
  };

  serveFile = async (req: Request, res: Response) => {
    const doc = await this.documentsRepository.findBySlug(req.params.slug as string);
    if (!doc || !doc.isActive) return res.status(404).json({ error: 'Not found' });

    // Path resolution needs to be careful from ESM /src/modules/share
    const filePath = path.resolve(__dirname, '../../../../uploads', doc.filePath);
    const ext = path.extname(doc.filePath).toLowerCase();
    
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };

    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.setHeader('Content-Disposition', 'inline');
    res.sendFile(filePath);
  };
}
