import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, BarChart3, Clock, LayoutGrid, Users } from 'lucide-react'
import { getAnalytics } from '../api/analytics'
import StatsCards from '../components/analytics/StatsCards'
import ViewTimeline from '../components/analytics/ViewTimeline'
import PageHeatmap from '../components/analytics/PageHeatmap'
import ViewerTable from '../components/analytics/ViewerTable'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import SectionHeader from '../components/ui/SectionHeader'

export default function Analytics() {
  const { id } = useParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAnalytics(id)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center h-[50vh]">
      <LoadingSpinner />
    </div>
  )
  
  if (!data) return (
    <div className="max-w-xl mx-auto py-12">
      <Card padding="lg" className="text-center">
        <p className="text-neutral-500 font-bold mb-6">Failed to load analytics</p>
        <Link to="/dashboard">
          <Button variant="secondary">Back to Dashboard</Button>
        </Link>
      </Card>
    </div>
  )

  const actions = (
    <Link to="/dashboard">
      <Button variant="secondary" size="md" leftIcon={<ChevronLeft className="w-4 h-4" />}>
        Back
      </Button>
    </Link>
  )

  return (
    <div className="space-y-10">
      <SectionHeader 
        title="Analytics" 
        description={data.document.title}
        actions={actions}
      />

      <StatsCards stats={data.stats} />
      
      <Card padding="none" className="overflow-hidden">
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-50 rounded-lg text-brand-600">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 tracking-tight">View Timeline</h3>
          </div>
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest px-2 py-1 bg-neutral-50 rounded-md border border-neutral-100">
            Last 30 Days
          </p>
        </div>
        <div className="p-8">
          <ViewTimeline data={data.viewTimeline} />
        </div>
      </Card>
      
      <div className="grid lg:grid-cols-2 gap-10">
        <Card padding="none" className="overflow-hidden">
          <div className="p-6 border-b border-neutral-100 flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 tracking-tight">Page Performance</h3>
          </div>
          <div className="p-8">
            <PageHeatmap data={data.pageHeatmap} />
          </div>
        </Card>
        
        <Card padding="none" className="overflow-hidden">
          <div className="p-6 border-b border-neutral-100 flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 tracking-tight">Recent Viewers</h3>
          </div>
          <ViewerTable viewers={data.viewers} />
        </Card>
      </div>
    </div>
  )
}
