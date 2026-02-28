import { get } from './client';

export const getAnalytics = (docId) => get(`/analytics/${docId}/analytics`);
