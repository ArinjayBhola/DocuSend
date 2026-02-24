import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getDeals } from '../api/deals'
import { useAuth } from '../hooks/useAuth'
import DealCard from '../components/deals/DealCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'

export default function Deals() {
  const { user } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getDeals()
      .then(setData)
      .catch((err) => setError(err.message || 'Failed to load deals'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  // Plan gate for free users
  if (user?.plan === 'free') {
    return (
      <div className="min-h-screen bg-neutral-50 px-4 sm:px-6 lg:px-8 pt-24 pb-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-24 bg-white rounded-2xl border border-neutral-100 shadow-sm">
            <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <svg className="w-8 h-8 text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-neutral-900 mb-2">Deal Intelligence</h3>
            <p className="text-sm text-neutral-500 font-medium mb-6 max-w-md mx-auto">
              Track deals, stakeholder engagement, risk signals, and get AI-powered next best actions. Available on Pro and Business plans.
            </p>
            <Link
              to="/billing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-brand-600 text-white shadow-md hover:bg-brand-700 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              Upgrade to Pro
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 px-4 sm:px-6 lg:px-8 pt-24 pb-10">
        <div className="max-w-7xl mx-auto text-center py-24">
          <p className="text-red-500 font-medium">{error}</p>
        </div>
      </div>
    )
  }

  const deals = data?.deals || []

  return (
    <div className="min-h-screen bg-neutral-50 px-4 sm:px-6 lg:px-8 pt-24 pb-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Deals</h1>
            <p className="text-sm font-medium text-neutral-500 mt-1">
              {deals.length} active deal{deals.length !== 1 ? 's' : ''} with intelligence tracking
            </p>
          </div>
          <Link
            to="/deals/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-neutral-900 text-white shadow-md hover:bg-neutral-800 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Deal
          </Link>
        </div>

        {deals.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-neutral-100 shadow-sm">
            <div className="w-16 h-16 bg-neutral-50 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <svg className="w-8 h-8 text-neutral-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-1">No deals yet</h3>
            <p className="text-sm text-neutral-500 font-medium mb-4">Create your first deal to start tracking engagement intelligence.</p>
            <Link to="/deals/new" className="text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors">
              Create a deal &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {deals.map((deal: any) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
