import { Eye, Users, Clock, Zap } from 'lucide-react'
import { formatDuration } from '../../utils/format'
import Card from '../ui/Card'

export default function StatsCards({ stats }: { stats: any }) {
  const cards = [
    { label: 'Total Views', value: stats.totalViews, icon: Eye, color: 'text-brand-600' },
    { label: 'Unique Viewers', value: stats.uniqueViewers, icon: Users, color: 'text-emerald-600' },
    { label: 'Avg Duration', value: formatDuration(Math.round(stats.avgDuration)), icon: Clock, color: 'text-amber-600' },
    { label: 'Total Time', value: formatDuration(stats.totalDuration), icon: Zap, color: 'text-indigo-600' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map(card => (
        <Card key={card.label} padding="md" className="flex items-center space-x-4">
          <div className={`p-2.5 rounded-xl bg-neutral-50 ${card.color} border border-neutral-100`}>
            <card.icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">{card.label}</p>
            <p className="text-xl font-bold text-neutral-900 leading-none">{card.value}</p>
          </div>
        </Card>
      ))}
    </div>
  )
}
