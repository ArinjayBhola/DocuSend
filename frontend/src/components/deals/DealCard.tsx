import { Link } from 'react-router-dom'
import DealHealthBadge from './DealHealthBadge'
import StagePill from './StagePill'

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
}

export default function DealCard({ deal }: { deal: any }) {
  return (
    <Link
      to={`/deals/${deal.id}`}
      className="block bg-white border border-neutral-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-neutral-900 tracking-tight truncate">{deal.accountName}</h3>
          <p className="text-sm font-medium text-neutral-500 mt-0.5 truncate">{deal.workspaceName}</p>
        </div>
        <DealHealthBadge status={deal.healthStatus} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <StagePill stage={deal.stage} />
        {deal.value > 0 && (
          <span className="text-sm font-bold text-neutral-900">{formatCurrency(deal.value, deal.currency)}</span>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>
          <span className="text-xs font-semibold text-neutral-500">{deal.stakeholderCount} stakeholder{deal.stakeholderCount !== 1 ? 's' : ''}</span>
        </div>
        {deal.closeDate && (
          <span className="text-xs font-medium text-neutral-400">Close: {new Date(deal.closeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        )}
      </div>
    </Link>
  )
}
