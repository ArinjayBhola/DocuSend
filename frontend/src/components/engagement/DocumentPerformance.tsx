import { Link } from 'react-router-dom'
import ScoreBadge from './ScoreBadge'

interface DocPerf {
  documentId: number
  title: string
  avgEngagementScore: number
  totalViewers: number
  completionRate: number
  avgTimeSpent: number
  hotLeads: number
  warmLeads: number
  interestedLeads: number
  coldLeads: number
}

interface DocumentPerformanceProps {
  documents: DocPerf[]
}

function classify(score: number) {
  if (score >= 80) return 'hot' as const
  if (score >= 50) return 'warm' as const
  if (score >= 20) return 'interested' as const
  return 'cold' as const
}

function formatDuration(seconds: number) {
  if (!seconds || seconds < 1) return '0s'
  if (seconds < 60) return `${Math.round(seconds)}s`
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  return `${hrs}h ${mins % 60}m`
}

export default function DocumentPerformance({ documents }: DocumentPerformanceProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-neutral-100 shadow-sm">
        <p className="text-sm font-semibold text-neutral-900">No document data yet</p>
        <p className="text-xs font-medium text-neutral-500 mt-1">Share your documents to see performance metrics</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100">
              <th className="text-left text-xs font-bold text-neutral-400 uppercase tracking-wider px-5 py-3">Document</th>
              <th className="text-left text-xs font-bold text-neutral-400 uppercase tracking-wider px-5 py-3">Avg Score</th>
              <th className="text-left text-xs font-bold text-neutral-400 uppercase tracking-wider px-5 py-3">Viewers</th>
              <th className="text-left text-xs font-bold text-neutral-400 uppercase tracking-wider px-5 py-3">Completion</th>
              <th className="text-left text-xs font-bold text-neutral-400 uppercase tracking-wider px-5 py-3">Avg Time</th>
              <th className="text-left text-xs font-bold text-neutral-400 uppercase tracking-wider px-5 py-3">Lead Breakdown</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {documents.map((doc) => (
              <tr key={doc.documentId} className="hover:bg-neutral-50 transition-colors">
                <td className="px-5 py-4">
                  <Link
                    to={`/documents/${doc.documentId}/analytics`}
                    className="text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline underline-offset-4 transition-all"
                  >
                    {doc.title}
                  </Link>
                </td>
                <td className="px-5 py-4">
                  <ScoreBadge classification={classify(doc.avgEngagementScore)} score={doc.avgEngagementScore} size="sm" />
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm font-semibold text-neutral-900">{doc.totalViewers}</span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full" style={{ width: `${doc.completionRate}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-neutral-600">{doc.completionRate}%</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm font-medium text-neutral-600">{formatDuration(doc.avgTimeSpent)}</span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    {doc.hotLeads > 0 && <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700">{doc.hotLeads} hot</span>}
                    {doc.warmLeads > 0 && <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">{doc.warmLeads} warm</span>}
                    {doc.interestedLeads > 0 && <span className="px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">{doc.interestedLeads}</span>}
                    {doc.coldLeads > 0 && <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">{doc.coldLeads}</span>}
                    {doc.totalViewers === 0 && <span className="text-neutral-400">No viewers</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
