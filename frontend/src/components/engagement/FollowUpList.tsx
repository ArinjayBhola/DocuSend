import ScoreBadge from './ScoreBadge'

interface FollowUpSuggestion {
  viewerEmail: string
  documentId: number
  documentTitle: string
  priority: 'high' | 'medium' | 'low'
  action: string
  reason: string
  suggestedTiming: string
  score: number
  classification: 'hot' | 'warm' | 'interested' | 'cold'
}

interface FollowUpListProps {
  suggestions: FollowUpSuggestion[]
}

const priorityConfig = {
  high: { dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', label: 'High' },
  medium: { dot: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', label: 'Medium' },
  low: { dot: 'bg-neutral-400', bg: 'bg-neutral-50', text: 'text-neutral-600', label: 'Low' },
}

export default function FollowUpList({ suggestions }: FollowUpListProps) {
  if (suggestions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-neutral-100 shadow-sm">
        <div className="w-12 h-12 bg-neutral-50 rounded-xl flex items-center justify-center mb-3 mx-auto">
          <svg className="w-6 h-6 text-neutral-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-neutral-900">No follow-ups needed</p>
        <p className="text-xs font-medium text-neutral-500 mt-1">Check back when viewers engage with your documents</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {suggestions.map((s, i) => {
        const pc = priorityConfig[s.priority]
        return (
          <div key={`${s.viewerEmail}-${s.documentId}-${i}`} className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${pc.dot}`} />
                <span className="text-sm font-bold text-neutral-900">{s.action}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pc.bg} ${pc.text}`}>
                  {pc.label}
                </span>
                <ScoreBadge classification={s.classification} score={s.score} size="sm" />
              </div>
            </div>
            <p className="text-xs font-medium text-neutral-600 mb-2">{s.reason}</p>
            <div className="flex items-center justify-between text-xs font-medium text-neutral-500">
              <span>{s.viewerEmail}</span>
              <span>Suggested: {s.suggestedTiming}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
