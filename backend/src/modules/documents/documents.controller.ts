import { Request, Response } from 'express';
import { DocumentsService } from './documents.service.js';
import { updateDocumentSchema } from './documents.validation.js';
import { BadRequestError } from '../../core/errors/AppError.js';

export class DocumentsController {
  private service: DocumentsService;

  constructor() {
    this.service = new DocumentsService();
  }

  upload = async (req: Request, res: Response) => {
    const file = req.file as Express.Multer.File;
    if (!file) {
      throw new BadRequestError('Please select a file');
    }

    const { title } = req.body;
    const document = await this.service.uploadDocument(req.userId!, file, title);
    res.json({ document });
  };

  getOne = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    const document = await this.service.getDocument(id, req.userId!);
    res.json({ document });
  };

  update = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    const validated = updateDocumentSchema.parse(req.body);
    
    const document = await this.service.updateDocument(id, req.userId!, validated);
    res.json({ document });
  };

  delete = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    await this.service.deleteDocument(id, req.userId!);
    res.json({ ok: true });
  };
}
