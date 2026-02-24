import { useState } from 'react'
import { updateDeal } from '../../api/deals'
import DealHealthBadge from './DealHealthBadge'
import StagePill from './StagePill'

const STAGES = ['prospecting', 'discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost']

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
}

export default function DealHeader({ deal, stats, onUpdate }: { deal: any; stats: any; onUpdate: () => void }) {
  const [changingStage, setChangingStage] = useState(false)

  const handleStageChange = async (newStage: string) => {
    try {
      await updateDeal(deal.id, { stage: newStage })
      setChangingStage(false)
      onUpdate()
    } catch { /* ignore */ }
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">{deal.accountName}</h1>
          <p className="text-sm font-medium text-neutral-500 mt-1">{deal.workspaceName}</p>
        </div>
        <DealHealthBadge status={deal.healthStatus} />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        {changingStage ? (
          <div className="flex items-center gap-2">
            {STAGES.map(s => (
              <button
                key={s}
                onClick={() => handleStageChange(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${s === deal.stage ? 'bg-brand-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
            <button onClick={() => setChangingStage(false)} className="text-xs text-neutral-400 hover:text-neutral-600 ml-1">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setChangingStage(true)} className="group">
            <StagePill stage={deal.stage} />
            <span className="text-xs text-neutral-400 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">change</span>
          </button>
        )}

        {deal.value > 0 && (
          <span className="text-lg font-bold text-neutral-900">{formatCurrency(deal.value, deal.currency)}</span>
        )}

        {deal.closeDate && (
          <span className="text-sm font-medium text-neutral-400">
            Close: {new Date(deal.closeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-neutral-50 rounded-xl p-3">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Documents</p>
          <p className="text-xl font-extrabold text-neutral-900 mt-0.5">{stats.totalDocuments}</p>
        </div>
        <div className="bg-neutral-50 rounded-xl p-3">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Total Views</p>
          <p className="text-xl font-extrabold text-neutral-900 mt-0.5">{stats.totalViews}</p>
        </div>
        <div className="bg-neutral-50 rounded-xl p-3">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Time Spent</p>
          <p className="text-xl font-extrabold text-neutral-900 mt-0.5">{stats.totalDuration >= 60 ? `${Math.round(stats.totalDuration / 60)}m` : `${stats.totalDuration}s`}</p>
        </div>
        <div className="bg-neutral-50 rounded-xl p-3">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Days in Stage</p>
          <p className="text-xl font-extrabold text-neutral-900 mt-0.5">{stats.daysInStage}</p>
        </div>
      </div>
    </div>
  )
}
