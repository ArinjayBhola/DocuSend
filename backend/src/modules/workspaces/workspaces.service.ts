import { WorkspacesRepository } from './workspaces.repository.js';
import { DocumentsRepository } from '../documents/index.js';
import { CreateWorkspaceInput, AddDocumentInput, WorkspaceWithCount } from './workspaces.types.js';
import { NotFoundError } from '../../core/errors/AppError.js';
import { generateSlug } from '../../utils/helpers.js';

export class WorkspacesService {
  private repository: WorkspacesRepository;
  private documentsRepository: DocumentsRepository;

  constructor() {
    this.repository = new WorkspacesRepository();
    this.documentsRepository = new DocumentsRepository();
  }

  async getAllWorkspaces(userId: number): Promise<WorkspaceWithCount[]> {
    const userWorkspaces = await this.repository.findAllByUser(userId);
    return Promise.all(userWorkspaces.map(async (ws) => {
      const docCount = await this.repository.getDocCount(ws.id);
      return { ...ws, docCount };
    }));
  }

  async createWorkspace(userId: number, input: CreateWorkspaceInput) {
    const slug = generateSlug();
    return this.repository.create({
      userId,
      name: input.name,
      slug,
      description: input.description,
    });
  }

  async getWorkspaceDetail(id: number, userId: number) {
    const workspace = await this.repository.findByIdAndUser(id, userId);
    if (!workspace) throw new NotFoundError('Workspace not found');

    const wsDocs = await this.repository.getWorkspaceDocuments(workspace.id);
    const allDocs = await this.documentsRepository.findAllByUser(userId);

    return { workspace, documents: wsDocs, allDocs };
  }

  async addDocumentToWorkspace(id: number, userId: number, input: AddDocumentInput) {
    const workspace = await this.repository.findByIdAndUser(id, userId);
    if (!workspace) throw new NotFoundError('Workspace not found');

    const maxOrder = await this.repository.getMaxOrder(workspace.id);

    await this.repository.addDocument({
      workspaceId: workspace.id,
      documentId: input.documentId,
      order: (maxOrder || 0) + 1,
    });
  }

  async removeDocumentFromWorkspace(id: number, userId: number, wdId: number) {
    // Basic verification
    const workspace = await this.repository.findByIdAndUser(id, userId);
    if (!workspace) throw new NotFoundError('Workspace not found');

    await this.repository.removeDocument(wdId);
  }

  async deleteWorkspace(id: number, userId: number) {
    await this.repository.delete(id, userId);
  }

  async getPublicWorkspace(slug: string) {
    const workspace = await this.repository.findBySlug(slug);
    if (!workspace) throw new NotFoundError('Workspace not found');

    const wsDocs = await this.repository.getWorkspaceDocuments(workspace.id);
    return { workspace, documents: wsDocs };
  }
}
