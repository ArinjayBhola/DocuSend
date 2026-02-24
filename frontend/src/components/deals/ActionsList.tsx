import { useState, useEffect } from 'react'
import { getActions } from '../../api/deals'

const typeIcons: Record<string, string> = {
  contact: 'M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75',
  send_doc: 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z',
  schedule: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5',
}

const priorityConfig: Record<string, { bg: string; text: string; dot: string }> = {
  high: { bg: 'border-l-red-500', text: 'text-red-600', dot: 'bg-red-500' },
  medium: { bg: 'border-l-amber-500', text: 'text-amber-600', dot: 'bg-amber-500' },
  low: { bg: 'border-l-blue-400', text: 'text-blue-600', dot: 'bg-blue-400' },
}

export default function ActionsList({ dealId }: { dealId: string }) {
  const [actions, setActions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getActions(dealId)
      .then(d => setActions(d.actions || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [dealId])

  if (loading) return <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
      <h3 className="text-base font-bold text-neutral-900 tracking-tight mb-5">Next Best Actions</h3>

      {actions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm font-medium text-neutral-500">No actions recommended at this time</p>
        </div>
      ) : (
        <div className="space-y-3">
          {actions.map((action: any, i: number) => {
            const pc = priorityConfig[action.priority] || priorityConfig.low
            const iconPath = typeIcons[action.type] || typeIcons.contact
            return (
              <div key={i} className={`border-l-4 ${pc.bg} bg-neutral-50 rounded-r-xl px-4 py-3.5`}>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
                      <span className={`text-xs font-bold uppercase ${pc.text}`}>{action.priority}</span>
                      <span className="text-xs font-medium text-neutral-400">{action.action.replace(/_/g, ' ')}</span>
                    </div>
                    <p className="text-sm font-medium text-neutral-800">{action.description}</p>
                    {action.email && (
                      <p className="text-xs text-neutral-400 mt-1">{action.email}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
