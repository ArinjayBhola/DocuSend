import { get, put, del, upload } from './client';

export const getDashboard = () => get('/dashboard');
export const uploadDocument = (formData) => upload('/documents/upload', formData);
export const getDocument = (id) => get(`/documents/${id}`);
export const updateDocument = (id, data) => put(`/documents/${id}`, data);
export const deleteDocument = (id) => del(`/documents/${id}`);
