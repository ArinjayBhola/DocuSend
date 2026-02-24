import { formatDuration } from '../../utils/format'

export default function StatsCards({ stats }: { stats: any }) {
  const cards = [
    { label: 'Total Views', value: stats.totalViews },
    { label: 'Unique Viewers', value: stats.uniqueViewers },
    { label: 'Avg Duration', value: formatDuration(Math.round(stats.avgDuration)) },
    { label: 'Total Time', value: formatDuration(stats.totalDuration) },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => (
        <div key={card.label} className="bg-white rounded-2xl border border-neutral-100 p-6 flex flex-col justify-center items-center shadow-sm hover:-translate-y-1 transition-transform duration-300">
          <div className="text-3xl font-extrabold text-neutral-900 mb-1 tracking-tight">{card.value}</div>
          <div className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase">{card.label}</div>
        </div>
      ))}
    </div>
  )
}
