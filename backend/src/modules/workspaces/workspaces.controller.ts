import { Request, Response } from 'express';
import { WorkspacesService } from './workspaces.service.js';
import { createWorkspaceSchema, addDocumentSchema } from './workspaces.validation.js';

export class WorkspacesController {
  private service: WorkspacesService;

  constructor() {
    this.service = new WorkspacesService();
  }

  list = async (req: Request, res: Response) => {
    const workspaces = await this.service.getAllWorkspaces(req.userId!);
    res.json({ workspaces });
  };

  create = async (req: Request, res: Response) => {
    const validated = createWorkspaceSchema.parse(req.body);
    const workspace = await this.service.createWorkspace(req.userId!, validated);
    res.json({ workspace });
  };

  getOne = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    const result = await this.service.getWorkspaceDetail(id, req.userId!);
    res.json(result);
  };

  addDocument = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    const validated = addDocumentSchema.parse(req.body);
    await this.service.addDocumentToWorkspace(id, req.userId!, validated);
    res.json({ ok: true });
  };

  removeDocument = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    const wdId = parseInt(req.params.wdId as string);
    await this.service.removeDocumentFromWorkspace(id, req.userId!, wdId);
    res.json({ ok: true });
  };

  delete = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    await this.service.deleteWorkspace(id, req.userId!);
    res.json({ ok: true });
  };

  getPublic = async (req: Request, res: Response) => {
    const result = await this.service.getPublicWorkspace(req.params.slug as string);
    res.json(result);
  };
}
