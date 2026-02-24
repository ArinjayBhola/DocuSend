import { useState, useEffect } from 'react'
import { getTimeline } from '../../api/deals'

function timeAgo(dateStr: string) {
  if (!dateStr) return ''
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const typeConfig: Record<string, { color: string; icon: string }> = {
  stage_change: { color: 'bg-violet-500', icon: 'M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5-6L16.5 16.5m0 0L12 10.5m4.5 6V3' },
  stakeholder_added: { color: 'bg-blue-500', icon: 'M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z' },
  view_detected: { color: 'bg-green-500', icon: 'M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z' },
  risk_changed: { color: 'bg-amber-500', icon: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z' },
}

export default function DealTimeline({ dealId }: { dealId: string }) {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTimeline(dealId)
      .then(d => setActivities(d.activities || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [dealId])

  if (loading) return <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
      <h3 className="text-base font-bold text-neutral-900 tracking-tight mb-5">Activity Timeline</h3>

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm font-medium text-neutral-500">No activity recorded yet</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-[15px] top-0 bottom-0 w-px bg-neutral-100" />
          <div className="space-y-4">
            {activities.map((a: any) => {
              const tc = typeConfig[a.type] || typeConfig.view_detected
              return (
                <div key={a.id} className="flex gap-4 relative">
                  <div className={`w-8 h-8 rounded-full ${tc.color} flex items-center justify-center flex-shrink-0 z-10`}>
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d={tc.icon} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <p className="text-sm font-medium text-neutral-800">{a.description}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{timeAgo(a.createdAt)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
