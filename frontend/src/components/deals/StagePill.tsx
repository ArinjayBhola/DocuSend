const stageConfig: Record<string, { bg: string; text: string; label: string }> = {
  prospecting: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Prospecting' },
  discovery: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Discovery' },
  proposal: { bg: 'bg-violet-50', text: 'text-violet-700', label: 'Proposal' },
  negotiation: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Negotiation' },
  closed_won: { bg: 'bg-green-50', text: 'text-green-700', label: 'Closed Won' },
  closed_lost: { bg: 'bg-red-50', text: 'text-red-700', label: 'Closed Lost' },
}

export default function StagePill({ stage }: { stage: string }) {
  const c = stageConfig[stage] || stageConfig.prospecting
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  )
}
