interface ScoreBadgeProps {
  classification: 'hot' | 'warm' | 'interested' | 'cold'
  score: number
  size?: 'sm' | 'md'
}

const config = {
  hot: { label: 'Hot', bg: 'bg-red-100', text: 'text-red-700', ring: 'ring-red-200' },
  warm: { label: 'Warm', bg: 'bg-orange-100', text: 'text-orange-700', ring: 'ring-orange-200' },
  interested: { label: 'Interested', bg: 'bg-yellow-100', text: 'text-yellow-700', ring: 'ring-yellow-200' },
  cold: { label: 'Cold', bg: 'bg-blue-100', text: 'text-blue-700', ring: 'ring-blue-200' },
}

export default function ScoreBadge({ classification, score, size = 'md' }: ScoreBadgeProps) {
  const c = config[classification]
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'

  return (
    <span className={`inline-flex items-center gap-1 ${sizeClasses} font-bold rounded-full ring-1 ${c.bg} ${c.text} ${c.ring}`}>
      {classification === 'hot' && <span>🔥</span>}
      {c.label} {score}
    </span>
  )
}
