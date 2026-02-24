const config = {
  healthy: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Healthy' },
  at_risk: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'At Risk' },
  critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Critical' },
}

export default function DealHealthBadge({ status }: { status: string }) {
  const c = config[status as keyof typeof config] || config.healthy
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'healthy' ? 'bg-green-500' : status === 'at_risk' ? 'bg-amber-500' : 'bg-red-500'}`} />
      {c.label}
    </span>
  )
}
