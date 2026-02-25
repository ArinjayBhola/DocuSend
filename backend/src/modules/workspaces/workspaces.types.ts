import { workspaces, workspaceDocuments } from '../../db/schema.js';

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;

export type WorkspaceDocument = typeof workspaceDocuments.$inferSelect;
export type NewWorkspaceDocument = typeof workspaceDocuments.$inferInsert;

export interface WorkspaceWithCount extends Workspace {
  docCount: number;
}

export * from './workspaces.validation.js';
