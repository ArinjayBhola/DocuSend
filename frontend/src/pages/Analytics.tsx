import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getAnalytics } from '../api/analytics'
import StatsCards from '../components/analytics/StatsCards'
import ViewTimeline from '../components/analytics/ViewTimeline'
import PageHeatmap from '../components/analytics/PageHeatmap'
import ViewerTable from '../components/analytics/ViewerTable'
import LoadingSpinner from '../components/ui/LoadingSpinner'

export default function Analytics() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAnalytics(id)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner />
  if (!data) return <div className="min-h-screen bg-neutral-50 pt-32 text-center text-neutral-500 font-medium">Failed to load analytics</div>

  return (
    <div className="min-h-screen bg-neutral-50 px-4 sm:px-6 lg:px-8 pt-24 pb-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <Link to="/dashboard" className="w-10 h-10 bg-white border border-neutral-200 rounded-xl flex items-center justify-center text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 hover:border-neutral-300 transition-all shadow-sm">
            &larr;
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Analytics</h1>
            <p className="text-sm font-semibold text-neutral-500 mt-1">{data.document.title}</p>
          </div>
        </div>

        <div className="space-y-8">
          <StatsCards stats={data.stats} />
          <ViewTimeline data={data.viewTimeline} />
          
          <div className="grid lg:grid-cols-2 gap-8">
            <PageHeatmap data={data.pageHeatmap} />
            <ViewerTable viewers={data.viewers} />
          </div>
        </div>
      </div>
    </div>
  )
}
