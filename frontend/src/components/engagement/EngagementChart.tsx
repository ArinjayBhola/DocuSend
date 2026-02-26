interface EngagementChartProps {
  scores: Array<{
    score: number
    classification: 'hot' | 'warm' | 'interested' | 'cold'
  }>
}

export default function EngagementChart({ scores }: EngagementChartProps) {
  const hot = scores.filter(s => s.classification === 'hot').length
  const warm = scores.filter(s => s.classification === 'warm').length
  const interested = scores.filter(s => s.classification === 'interested').length
  const cold = scores.filter(s => s.classification === 'cold').length
  const total = scores.length

  if (total === 0) return null

  const segments = [
    { label: 'Hot', count: hot, color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-100' },
    { label: 'Warm', count: warm, color: 'bg-orange-500', textColor: 'text-orange-700', bgColor: 'bg-orange-100' },
    { label: 'Interested', count: interested, color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-100' },
    { label: 'Cold', count: cold, color: 'bg-blue-400', textColor: 'text-blue-700', bgColor: 'bg-blue-100' },
  ]

  return (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5">
      <h3 className="text-sm font-bold text-neutral-900 mb-4">Score Distribution</h3>

      {/* Stacked bar */}
      <div className="h-4 rounded-full overflow-hidden flex mb-4">
        {segments.map(s => s.count > 0 && (
          <div
            key={s.label}
            className={`${s.color} transition-all`}
            style={{ width: `${(s.count / total) * 100}%` }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {segments.map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${s.color} flex-shrink-0`} />
            <div>
              <p className="text-xs font-bold text-neutral-900">{s.count}</p>
              <p className="text-xs font-medium text-neutral-500">{s.label} ({total > 0 ? Math.round((s.count / total) * 100) : 0}%)</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
