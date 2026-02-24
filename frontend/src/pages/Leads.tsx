import { useState, useEffect, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { getLeads, exportLeadsCsv } from '../api/leads'
import LoadingSpinner from '../components/ui/LoadingSpinner'

function formatDuration(seconds: number) {
  if (!seconds || seconds < 1) return '0s'
  if (seconds < 60) return `${Math.round(seconds)}s`
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  if (mins < 60) return `${mins}m ${secs}s`
  const hrs = Math.floor(mins / 60)
  return `${hrs}h ${mins % 60}m`
}

function timeAgo(dateStr: string) {
  if (!dateStr) return ''
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Leads() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [expandedLead, setExpandedLead] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    getLeads()
      .then(setData)
      .catch((err) => setError(err.message || 'Failed to load leads'))
      .finally(() => setLoading(false))
  }, [])

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportLeadsCsv()
    } catch {
      alert('Failed to export leads')
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 px-4 sm:px-6 lg:px-8 pt-24 pb-10">
        <div className="max-w-7xl mx-auto text-center py-24">
          <p className="text-red-500 font-medium">{error}</p>
        </div>
      </div>
    )
  }

  const filteredLeads = data?.leads?.filter((lead: any) =>
    lead.email.toLowerCase().includes(search.toLowerCase()) ||
    lead.documents.some((d: any) => d.title.toLowerCase().includes(search.toLowerCase()))
  ) || []

  return (
    <div className="min-h-screen bg-neutral-50 px-4 sm:px-6 lg:px-8 pt-24 pb-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Leads</h1>
            <p className="text-sm font-medium text-neutral-500 mt-1">
              {data?.totalLeads || 0} contacts captured across your documents
            </p>
          </div>
          {data?.totalLeads > 0 && (
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-neutral-900 text-white shadow-md hover:bg-neutral-800 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          )}
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Total Leads</p>
            <p className="text-3xl font-extrabold text-neutral-900 mt-1">{data?.totalLeads || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Total Views</p>
            <p className="text-3xl font-extrabold text-neutral-900 mt-1">{data?.totalViews || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Avg Views/Lead</p>
            <p className="text-3xl font-extrabold text-neutral-900 mt-1">
              {data?.totalLeads ? (data.totalViews / data.totalLeads).toFixed(1) : '0'}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by email or document..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-80 px-4 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </div>

        {/* Leads list */}
        {filteredLeads.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-neutral-100 shadow-sm">
            <div className="w-16 h-16 bg-neutral-50 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <svg className="w-8 h-8 text-neutral-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-1">
              {search ? 'No leads match your search' : 'No leads captured yet'}
            </h3>
            <p className="text-sm text-neutral-500 font-medium">
              {search ? 'Try a different search term.' : 'Enable email gating on your documents to capture leads.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-100">
                    <th className="text-left text-xs font-bold text-neutral-400 uppercase tracking-wider px-5 py-3">Email</th>
                    <th className="text-left text-xs font-bold text-neutral-400 uppercase tracking-wider px-5 py-3">Documents</th>
                    <th className="text-left text-xs font-bold text-neutral-400 uppercase tracking-wider px-5 py-3">Total Views</th>
                    <th className="text-left text-xs font-bold text-neutral-400 uppercase tracking-wider px-5 py-3">Time Spent</th>
                    <th className="text-left text-xs font-bold text-neutral-400 uppercase tracking-wider px-5 py-3">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {filteredLeads.map((lead: any) => (
                    <Fragment key={lead.email}>
                      <tr
                        onClick={() => setExpandedLead(expandedLead === lead.email ? null : lead.email)}
                        className="hover:bg-neutral-50 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-brand-700">{lead.email.charAt(0).toUpperCase()}</span>
                            </div>
                            <span className="text-sm font-semibold text-neutral-900">{lead.email}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-medium text-neutral-600">{lead.documents.length} doc{lead.documents.length !== 1 ? 's' : ''}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-semibold text-neutral-900">{lead.totalViews}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-medium text-neutral-600">{formatDuration(lead.totalDuration)}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-medium text-neutral-500">{timeAgo(lead.lastSeen)}</span>
                        </td>
                      </tr>
                      {expandedLead === lead.email && (
                        <tr>
                          <td colSpan={5} className="bg-neutral-50/50 px-5 py-3">
                            <div className="pl-11 space-y-2">
                              {lead.documents.map((doc: any) => (
                                <div key={doc.id} className="flex items-center justify-between py-1.5">
                                  <Link
                                    to={`/documents/${doc.id}/analytics`}
                                    className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline underline-offset-4 transition-all"
                                  >
                                    {doc.title}
                                  </Link>
                                  <div className="flex items-center gap-4 text-xs font-medium text-neutral-500">
                                    <span>{doc.viewCount} view{doc.viewCount !== 1 ? 's' : ''}</span>
                                    <span>{doc.avgPagesViewed} avg pages</span>
                                    <span>{timeAgo(doc.lastViewedAt)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
