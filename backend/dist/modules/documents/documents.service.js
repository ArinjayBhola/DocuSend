import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { DocumentsRepository } from './documents.repository.js';
import { generateSlug } from '../../utils/helpers.js';
import { NotFoundError } from '../../core/errors/AppError.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export class DocumentsService {
    repository;
    uploadDir;
    constructor() {
        this.repository = new DocumentsRepository();
        this.uploadDir = path.join(__dirname, '..', '..', '..', 'uploads');
    }
    MIMETYPE_TO_FILETYPE = {
        'application/pdf': 'pdf',
        'image/png': 'image',
        'image/jpeg': 'image',
        'image/gif': 'image',
        'image/webp': 'image',
    };
    async uploadDocument(userId, file, title) {
        const ext = path.extname(file.originalname);
        const finalTitle = title || file.originalname.replace(ext, '');
        const shareSlug = generateSlug();
        const fileType = this.MIMETYPE_TO_FILETYPE[file.mimetype] || 'pdf';
        const result = await this.repository.create({
            userId,
            title: finalTitle,
            fileName: file.originalname,
            filePath: file.filename,
            fileSize: file.size,
            shareSlug,
            fileType,
        });
        const document = await this.repository.findByIdAndUser(Number(result.lastInsertRowid), userId);
        if (!document)
            throw new Error('Failed to retrieve uploaded document');
        return document;
    }
    async getDocument(id, userId) {
        const doc = await this.repository.findByIdAndUser(id, userId);
        if (!doc)
            throw new NotFoundError('Document not found');
        return doc;
    }
    async updateDocument(id, userId, data) {
        const doc = await this.getDocument(id, userId);
        await this.repository.update(id, {
            title: data.title ?? doc.title,
            password: data.password !== undefined ? data.password : doc.password,
            requireEmail: data.requireEmail !== undefined ? data.requireEmail : doc.requireEmail,
            allowDownload: data.allowDownload !== undefined ? data.allowDownload : doc.allowDownload,
            expiresAt: data.expiresAt !== undefined ? data.expiresAt : doc.expiresAt,
            isActive: data.isActive !== undefined ? data.isActive : doc.isActive,
        });
        const updated = await this.repository.findByIdAndUser(id, userId);
        return updated;
    }
    async deleteDocument(id, userId) {
        const doc = await this.getDocument(id, userId);
        const filePath = path.join(this.uploadDir, doc.filePath);
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        catch (err) {
            console.error(`Failed to delete file ${filePath}`, err);
        }
        await this.repository.delete(id);
    }
    async getDocumentCount(userId) {
        return this.repository.countByUserId(userId);
    }
}
