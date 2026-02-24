import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getEngagement } from '../api/live'
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

function ScoreBadge({ score, tier }: { score: number; tier: string }) {
  const colors = {
    hot: 'bg-red-50 text-red-700 border-red-200 ring-red-500/10',
    warm: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/10',
    cold: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/10',
  }
  const icons = { hot: '🔥', warm: '🌤', cold: '❄' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ring-1 ${colors[tier] || colors.cold}`}>
      <span>{icons[tier] || '❄'}</span>
      {score}
    </span>
  )
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function LiveDashboard() {
  const [engagement, setEngagement] = useState<any>(null)
  const [activeSessions, setActiveSessions] = useState<any[]>([])
  const [activityFeed, setActivityFeed] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sseConnected, setSseConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Load engagement data
  useEffect(() => {
    getEngagement()
      .then(setEngagement)
      .catch(console.error)
      .finally(() => setLoading(false))

    // Refresh engagement every 60s
    const interval = setInterval(() => {
      getEngagement().then(setEngagement).catch(() => {})
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  // SSE connection for live updates
  useEffect(() => {
    const es = new EventSource('/api/live/stream', { withCredentials: true })
    eventSourceRef.current = es

    es.onopen = () => setSseConnected(true)
    es.onerror = () => setSseConnected(false)

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'init') {
          setActiveSessions(data.sessions || [])
          return
        }

        if (data.type === 'session_started') {
          setActiveSessions(prev => [...prev, data])
          setActivityFeed(prev => [{
            id: Date.now(),
            type: 'started',
            viewer: data.viewerEmail || data.viewerIp || 'Anonymous',
            document: data.documentTitle,
            time: new Date(),
          }, ...prev].slice(0, 50))
          return
        }

        if (data.type === 'page_changed') {
          setActiveSessions(prev => prev.map(s =>
            s.viewId === data.viewId
              ? { ...s, currentPage: data.currentPage, pagesVisited: data.pagesVisited, elapsedSeconds: data.elapsedSeconds }
              : s
          ))
          setActivityFeed(prev => [{
            id: Date.now(),
            type: 'page',
            viewer: data.viewerEmail || 'Anonymous',
            document: data.documentTitle,
            page: data.currentPage,
            totalPages: data.totalPages,
            time: new Date(),
          }, ...prev].slice(0, 50))
          return
        }

        if (data.type === 'session_ended') {
          setActiveSessions(prev => prev.filter(s => s.viewId !== data.viewId))
          setActivityFeed(prev => [{
            id: Date.now(),
            type: 'ended',
            viewer: data.viewerEmail || 'Anonymous',
            document: data.documentTitle,
            duration: data.duration,
            pagesVisited: data.pagesVisited,
            time: new Date(),
          }, ...prev].slice(0, 50))
          return
        }
      } catch { /* ignore parse errors */ }
    }

    return () => {
      es.close()
      eventSourceRef.current = null
      setSseConnected(false)
    }
  }, [])

  if (loading) return <LoadingSpinner />

  const summary = engagement?.summary || {}
  const viewers = engagement?.viewers || []
  const docRankings = engagement?.documentRankings || []

  return (
    <div className="min-h-screen bg-neutral-50 px-4 sm:px-6 lg:px-8 pt-24 pb-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Live Dashboard</h1>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${sseConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-neutral-100 text-neutral-500 border border-neutral-200'}`}>
                <span className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'}`} />
                {sseConnected ? 'Live' : 'Connecting...'}
              </div>
            </div>
            <p className="text-sm font-medium text-neutral-500 mt-1">
              Real-time visitor activity & engagement intelligence
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4">
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Active Now</p>
            <p className="text-2xl font-extrabold text-neutral-900 mt-1">{activeSessions.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4">
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">30d Views</p>
            <p className="text-2xl font-extrabold text-neutral-900 mt-1">{summary.totalViews30d || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4">
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Total Visitors</p>
            <p className="text-2xl font-extrabold text-neutral-900 mt-1">{summary.totalViewers || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-red-100 shadow-sm p-4 bg-red-50/30">
            <p className="text-[11px] font-bold text-red-400 uppercase tracking-wider">🔥 Hot Leads</p>
            <p className="text-2xl font-extrabold text-red-700 mt-1">{summary.hotLeads || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-4 bg-amber-50/30">
            <p className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">🌤 Warm</p>
            <p className="text-2xl font-extrabold text-amber-700 mt-1">{summary.warmLeads || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-4 bg-blue-50/30">
            <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">❄ Cold</p>
            <p className="text-2xl font-extrabold text-blue-700 mt-1">{summary.coldLeads || 0}</p>
          </div>
        </div>

        {/* Active Sessions + Live Feed */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Active Sessions */}
          <div className="bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-sm font-bold text-neutral-900">Active Viewers</h2>
              </div>
              <span className="text-xs font-bold text-neutral-400">{activeSessions.length} online</span>
            </div>
            <div className="divide-y divide-neutral-50 max-h-80 overflow-y-auto">
              {activeSessions.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm text-neutral-400 font-medium">No active viewers right now</p>
                  <p className="text-xs text-neutral-300 mt-1">Viewers will appear here in real-time</p>
                </div>
              ) : (
                activeSessions.map((session: any) => (
                  <div key={session.viewId} className="px-5 py-3 hover:bg-neutral-50 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
                          <span className="text-xs font-bold text-emerald-700">
                            {(session.viewerEmail || session.viewerIp || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">
                            {session.viewerEmail || session.viewerIp || 'Anonymous'}
                          </p>
                          <p className="text-xs text-neutral-400 font-medium">{session.documentTitle}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-brand-600">
                          Page {session.currentPage}/{session.totalPages}
                        </p>
                        <p className="text-[11px] text-neutral-400">{formatDuration(session.elapsedSeconds || 0)}</p>
                      </div>
                    </div>
                    {session.totalPages > 0 && (
                      <ProgressBar
                        value={session.currentPage}
                        max={session.totalPages}
                        color="bg-emerald-500"
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Live Activity Feed */}
          <div className="bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100">
              <h2 className="text-sm font-bold text-neutral-900">Live Activity Feed</h2>
            </div>
            <div className="divide-y divide-neutral-50 max-h-80 overflow-y-auto">
              {activityFeed.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm text-neutral-400 font-medium">Waiting for activity...</p>
                  <p className="text-xs text-neutral-300 mt-1">Events will stream here live</p>
                </div>
              ) : (
                activityFeed.map((event: any) => (
                  <div key={event.id} className="px-5 py-2.5 flex items-start gap-3">
                    <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      event.type === 'started' ? 'bg-emerald-100 text-emerald-600' :
                      event.type === 'ended' ? 'bg-neutral-100 text-neutral-500' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {event.type === 'started' ? (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                      ) : event.type === 'ended' ? (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27z"/></svg>
                      ) : (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-neutral-600">
                        <span className="font-semibold text-neutral-900">{event.viewer}</span>
                        {event.type === 'started' && <> opened <span className="font-medium">{event.document}</span></>}
                        {event.type === 'page' && <> is on page {event.page}/{event.totalPages} of <span className="font-medium">{event.document}</span></>}
                        {event.type === 'ended' && <> left <span className="font-medium">{event.document}</span> after {formatDuration(event.duration)} ({event.pagesVisited} pages)</>}
                      </p>
                      <p className="text-[11px] text-neutral-300 mt-0.5">
                        {event.time.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Engagement Scored Viewers + Document Rankings */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Engagement Scored Viewers */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-neutral-900">Engagement Scores</h2>
              <span className="text-[11px] font-medium text-neutral-400">Last 30 days</span>
            </div>
            {viewers.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <p className="text-sm text-neutral-400 font-medium">No viewer data yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-100">
                      <th className="text-left text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-5 py-2.5">Visitor</th>
                      <th className="text-left text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-5 py-2.5">Score</th>
                      <th className="text-left text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-5 py-2.5">Visits</th>
                      <th className="text-left text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-5 py-2.5">Time</th>
                      <th className="text-left text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-5 py-2.5">Completion</th>
                      <th className="text-left text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-5 py-2.5">Docs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {viewers.slice(0, 20).map((viewer: any, i: number) => (
                      <tr key={viewer.identifier} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                              viewer.tier === 'hot' ? 'bg-red-100' : viewer.tier === 'warm' ? 'bg-amber-100' : 'bg-blue-100'
                            }`}>
                              <span className={`text-xs font-bold ${
                                viewer.tier === 'hot' ? 'text-red-700' : viewer.tier === 'warm' ? 'text-amber-700' : 'text-blue-700'
                              }`}>
                                {viewer.identifier.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-neutral-900 truncate max-w-[200px]">
                                {viewer.isEmail ? viewer.email : viewer.identifier}
                              </p>
                              {!viewer.isEmail && <p className="text-[11px] text-neutral-400">IP-based</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <ScoreBadge score={viewer.score} tier={viewer.tier} />
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-sm font-semibold text-neutral-900">{viewer.visits}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-sm font-medium text-neutral-600">{formatDuration(viewer.totalDuration)}</span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16">
                              <ProgressBar
                                value={viewer.maxCompletionRate * 100}
                                max={100}
                                color={viewer.tier === 'hot' ? 'bg-red-500' : viewer.tier === 'warm' ? 'bg-amber-500' : 'bg-blue-500'}
                              />
                            </div>
                            <span className="text-xs font-bold text-neutral-500">{Math.round(viewer.maxCompletionRate * 100)}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-sm font-medium text-neutral-600">{viewer.documentsCount}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Document Rankings */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100">
              <h2 className="text-sm font-bold text-neutral-900">Top Documents</h2>
            </div>
            {docRankings.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <p className="text-sm text-neutral-400 font-medium">No document data yet</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-50">
                {docRankings.slice(0, 10).map((doc: any, i: number) => (
                  <Link
                    key={doc.documentId}
                    to={`/documents/${doc.documentId}/analytics`}
                    className="block px-5 py-3.5 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-extrabold text-neutral-500">#{i + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-neutral-900 line-clamp-1">{doc.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[11px] font-medium text-neutral-400">{doc.totalViews} views</span>
                            <span className="text-[11px] font-medium text-neutral-400">{doc.uniqueViewers} unique</span>
                            <span className="text-[11px] font-medium text-neutral-400">{doc.avgCompletion}% avg read</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-extrabold text-brand-600">{doc.engagementScore}</p>
                        <p className="text-[10px] font-bold text-neutral-300 uppercase">Score</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <ProgressBar value={doc.avgCompletion} max={100} color="bg-brand-500" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
