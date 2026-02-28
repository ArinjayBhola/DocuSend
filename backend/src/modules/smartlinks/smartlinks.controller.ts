import { Request, Response } from 'express';
import { SmartLinksService } from './smartlinks.service.js';
import {
  createSmartLinkSchema,
  updateSmartLinkSchema,
  listSmartLinksQuerySchema,
} from './smartlinks.validation.js';

export class SmartLinksController {
  private service: SmartLinksService;

  constructor() {
    this.service = new SmartLinksService();
  }

  create = async (req: Request, res: Response) => {
    const input = createSmartLinkSchema.parse(req.body);
    const link = await this.service.create(req.userId!, req.user!.plan, input);
    res.json({ link });
  };

  list = async (req: Request, res: Response) => {
    console.log('SmartLinksController.list called for user:', req.userId);
    const query = listSmartLinksQuerySchema.parse(req.query);
    console.log('Parsed query:', query);
    const links = await this.service.list(req.userId!, query.documentId);
    console.log('Total links found:', links.length);
    const paginated = links.slice(query.offset, query.offset + query.limit);
    res.json({ links: paginated, total: links.length });
  };

  getOne = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    const link = await this.service.getOne(id, req.userId!);
    res.json({ link });
  };

  update = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    const input = updateSmartLinkSchema.parse(req.body);
    const link = await this.service.update(id, req.userId!, input);
    res.json({ link });
  };

  remove = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    await this.service.remove(id, req.userId!);
    res.json({ ok: true });
  };

  duplicate = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    const link = await this.service.duplicate(id, req.userId!, req.user!.plan);
    res.json({ link });
  };
}
