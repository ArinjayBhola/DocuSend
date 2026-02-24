import { get, post } from './client';

export const register = (data) => post('/auth/register', data);
export const login = (data) => post('/auth/login', data);
export const logout = () => post('/auth/logout');
export const getMe = () => get('/auth/me');
