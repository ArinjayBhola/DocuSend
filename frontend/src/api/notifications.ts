import { get, post, put } from './client'

export const getNotifications = () => get('/notifications')
export const getUnreadCount = () => get('/notifications/unread-count')
export const markAsRead = (id: number) => post(`/notifications/${id}/read`, {})
export const markAllAsRead = () => post('/notifications/read-all', {})
export const getPreferences = () => get('/notifications/preferences')
export const updatePreferences = (prefs: any) => put('/notifications/preferences', prefs)
