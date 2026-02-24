import { get, post } from './client';

export const getShareDoc = (slug) => get(`/share/${slug}`);
export const verifyPassword = (slug, password) => post(`/share/${slug}/verify-password`, { password });
export const submitEmail = (slug, email) => post(`/share/${slug}/submit-email`, { email });
export const startView = (data) => post('/share/views/start', data);
export const trackPage = (data) => post('/share/views/page', data);
export const endView = (data) => {
  const body = JSON.stringify(data);
  navigator.sendBeacon('/api/share/views/end', body);
};
