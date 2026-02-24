import { get } from './client';

export const getAnalytics = (docId) => get(`/documents/${docId}/analytics`);
