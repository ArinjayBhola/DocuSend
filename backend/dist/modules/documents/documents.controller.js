import { DocumentsService } from './documents.service.js';
import { updateDocumentSchema } from './documents.validation.js';
import { BadRequestError } from '../../core/errors/AppError.js';
export class DocumentsController {
    service;
    constructor() {
        this.service = new DocumentsService();
    }
    upload = async (req, res) => {
        const file = req.file;
        if (!file) {
            throw new BadRequestError('Please select a file');
        }
        const { title } = req.body;
        const document = await this.service.uploadDocument(req.userId, file, title);
        res.json({ document });
    };
    getOne = async (req, res) => {
        const id = parseInt(req.params.id);
        const document = await this.service.getDocument(id, req.userId);
        res.json({ document });
    };
    update = async (req, res) => {
        const id = parseInt(req.params.id);
        const validated = updateDocumentSchema.parse(req.body);
        const document = await this.service.updateDocument(id, req.userId, validated);
        res.json({ document });
    };
    delete = async (req, res) => {
        const id = parseInt(req.params.id);
        await this.service.deleteDocument(id, req.userId);
        res.json({ ok: true });
    };
}
