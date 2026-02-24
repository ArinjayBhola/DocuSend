import { get, post } from './client';

export const getBilling = () => get('/billing');
export const subscribe = (plan) => post('/billing/subscribe', { plan });
export const cancelSubscription = () => post('/billing/cancel');
export const confirmSuccess = (data) => post('/billing/success', data);
