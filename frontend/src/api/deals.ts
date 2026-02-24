import { get, post, put, del } from './client'

export const getDeals = () => get('/deals')
export const createDeal = (data: any) => post('/deals', data)
export const getDeal = (id: string) => get(`/deals/${id}`)
export const updateDeal = (id: string, data: any) => put(`/deals/${id}`, data)
export const deleteDeal = (id: string) => del(`/deals/${id}`)

export const addStakeholder = (dealId: string, data: any) => post(`/deals/${dealId}/stakeholders`, data)
export const updateStakeholder = (dealId: string, sid: string, data: any) => put(`/deals/${dealId}/stakeholders/${sid}`, data)
export const removeStakeholder = (dealId: string, sid: string) => del(`/deals/${dealId}/stakeholders/${sid}`)
export const detectStakeholders = (dealId: string) => post(`/deals/${dealId}/detect-stakeholders`, {})

export const getIntentGraph = (dealId: string) => get(`/deals/${dealId}/intent-graph`)
export const getRiskScoring = (dealId: string) => get(`/deals/${dealId}/risk`)
export const getActions = (dealId: string) => get(`/deals/${dealId}/actions`)
export const getBrief = (dealId: string) => get(`/deals/${dealId}/brief`)
export const getTimeline = (dealId: string) => get(`/deals/${dealId}/timeline`)
