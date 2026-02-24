import { get } from './client'

export const getLeads = () => get('/leads')
export const getLeadsExportUrl = () => '/api/leads/export'
