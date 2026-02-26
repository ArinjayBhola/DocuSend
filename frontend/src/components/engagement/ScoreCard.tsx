import ScoreBadge from './ScoreBadge'

interface ScoreCardProps {
  score: {
    viewerEmail: string
    documentTitle: string
    score: number
    classification: 'hot' | 'warm' | 'interested' | 'cold'
    totalTimeSpent: number
    pagesViewed: number
    totalPages: number
    visitCount: number
    lastViewedAt: string
    timeScore: number
    completionScore: number
    frequencyScore: number
    recencyScore: number
    depthScore: number
  }
}

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
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

export default function ScoreCard({ score: s }: ScoreCardProps) {
  const completionPct = s.totalPages > 0 ? Math.round((s.pagesViewed / s.totalPages) * 100) : 0

  return (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-brand-700">{s.viewerEmail.charAt(0).toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-900 truncate">{s.viewerEmail}</p>
            <p className="text-xs font-medium text-neutral-500 truncate">{s.documentTitle}</p>
          </div>
        </div>
        <ScoreBadge classification={s.classification} score={s.score} />
      </div>

      {/* Score bar */}
      <div className="mb-3">
        <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              s.classification === 'hot' ? 'bg-red-500' :
              s.classification === 'warm' ? 'bg-orange-500' :
              s.classification === 'interested' ? 'bg-yellow-500' : 'bg-blue-400'
            }`}
            style={{ width: `${s.score}%` }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="font-medium text-neutral-500">Time Spent</span>
          <span className="font-semibold text-neutral-700">{formatDuration(s.totalTimeSpent)}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-neutral-500">Completion</span>
          <span className="font-semibold text-neutral-700">{completionPct}%</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-neutral-500">Visits</span>
          <span className="font-semibold text-neutral-700">{s.visitCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-neutral-500">Last Seen</span>
          <span className="font-semibold text-neutral-700">{timeAgo(s.lastViewedAt)}</span>
        </div>
      </div>
    </div>
  )
}
