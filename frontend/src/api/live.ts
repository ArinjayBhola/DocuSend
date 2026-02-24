import { get, post } from './client'

export const startLiveSession = (data: any) => post('/live/sessions/start', data)
export const livePageChange = (data: any) => post('/live/sessions/page-change', data)
export const endLiveSession = (data: any) => {
  navigator.sendBeacon('/api/live/sessions/end', JSON.stringify(data))
}
export const getEngagement = () => get('/live/engagement')
