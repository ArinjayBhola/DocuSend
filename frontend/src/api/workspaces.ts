import { get, post, del } from './client';

export const getWorkspaces = () => get('/workspaces');
export const createWorkspace = (data) => post('/workspaces', data);
export const getWorkspace = (id) => get(`/workspaces/${id}`);
export const addDocument = (wsId, documentId) => post(`/workspaces/${wsId}/documents`, { documentId });
export const removeDocument = (wsId, wdId) => del(`/workspaces/${wsId}/documents/${wdId}`);
export const deleteWorkspace = (id) => del(`/workspaces/${id}`);
export const getPublicWorkspace = (slug) => get(`/workspaces/public/${slug}`);
