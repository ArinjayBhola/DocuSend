import { get } from './client'

export const getLeads = () => get('/leads')

export const exportLeadsCsv = async () => {
  const res = await fetch('/api/leads/export', { credentials: 'include' })
  if (!res.ok) throw new Error('Export failed')
  const blob = await res.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'docusend-leads.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}
