import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getDeal, deleteDeal, getRiskScoring } from '../api/deals'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import DealHeader from '../components/deals/DealHeader'
import StakeholderTable from '../components/deals/StakeholderTable'
import DealTimeline from '../components/deals/DealTimeline'
import IntentGraph from '../components/deals/IntentGraph'
import RiskPanel from '../components/deals/RiskPanel'
import ActionsList from '../components/deals/ActionsList'
import ExecutiveBrief from '../components/deals/ExecutiveBrief'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'intent', label: 'Intent Graph' },
  { id: 'risk', label: 'Risk & Actions' },
  { id: 'brief', label: 'Brief' },
]

export default function DealDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [riskData, setRiskData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')

  const loadData = () => {
    Promise.all([
      getDeal(id!),
      getRiskScoring(id!).catch(() => null),
    ]).then(([dealData, risk]) => {
      setData(dealData)
      setRiskData(risk)
    }).catch(() => navigate('/deals'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [id])

  const handleDelete = async () => {
    if (!confirm('Delete this deal? This cannot be undone.')) return
    await deleteDeal(id!)
    navigate('/deals')
  }

  if (loading) return <LoadingSpinner />
  if (!data) return null

  return (
    <div className="min-h-screen bg-neutral-50 px-4 sm:px-6 lg:px-8 pt-24 pb-10">
      <div className="max-w-5xl mx-auto">
        {/* Back button */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/deals" className="w-10 h-10 bg-white border border-neutral-200 rounded-xl flex items-center justify-center text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 hover:border-neutral-300 transition-all shadow-sm">
            &larr;
          </Link>
          <div className="flex-1" />
          <button onClick={handleDelete} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
            Delete Deal
          </button>
        </div>

        <DealHeader deal={data.deal} stats={data.stats} onUpdate={loadData} />

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl border border-neutral-100 shadow-sm p-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                tab === t.id
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <StakeholderTable dealId={id!} stakeholders={data.stakeholders} riskData={riskData} onUpdate={loadData} />
            <DealTimeline dealId={id!} />
          </div>
        )}

        {tab === 'intent' && (
          <IntentGraph dealId={id!} />
        )}

        {tab === 'risk' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RiskPanel riskData={riskData} />
            <ActionsList dealId={id!} />
          </div>
        )}

        {tab === 'brief' && (
          <ExecutiveBrief dealId={id!} />
        )}
      </div>
    </div>
  )
}
