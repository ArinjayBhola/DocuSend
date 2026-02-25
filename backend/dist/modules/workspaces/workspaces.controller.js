import { WorkspacesService } from './workspaces.service.js';
import { createWorkspaceSchema, addDocumentSchema } from './workspaces.validation.js';
export class WorkspacesController {
    service;
    constructor() {
        this.service = new WorkspacesService();
    }
    list = async (req, res) => {
        const workspaces = await this.service.getAllWorkspaces(req.userId);
        res.json({ workspaces });
    };
    create = async (req, res) => {
        const validated = createWorkspaceSchema.parse(req.body);
        const workspace = await this.service.createWorkspace(req.userId, validated);
        res.json({ workspace });
    };
    getOne = async (req, res) => {
        const id = parseInt(req.params.id);
        const result = await this.service.getWorkspaceDetail(id, req.userId);
        res.json(result);
    };
    addDocument = async (req, res) => {
        const id = parseInt(req.params.id);
        const validated = addDocumentSchema.parse(req.body);
        await this.service.addDocumentToWorkspace(id, req.userId, validated);
        res.json({ ok: true });
    };
    removeDocument = async (req, res) => {
        const id = parseInt(req.params.id);
        const wdId = parseInt(req.params.wdId);
        await this.service.removeDocumentFromWorkspace(id, req.userId, wdId);
        res.json({ ok: true });
    };
    delete = async (req, res) => {
        const id = parseInt(req.params.id);
        await this.service.deleteWorkspace(id, req.userId);
        res.json({ ok: true });
    };
    getPublic = async (req, res) => {
        const result = await this.service.getPublicWorkspace(req.params.slug);
        res.json(result);
    };
}
