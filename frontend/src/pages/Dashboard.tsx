import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, FileText, LayoutGrid, Clock } from 'lucide-react'
import { getDashboard } from '../api/documents'
import DocumentCard from '../components/documents/DocumentCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Button from '../components/ui/Button'
import SectionHeader from '../components/ui/SectionHeader.tsx'
import Card from '../components/ui/Card'

export default function Dashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-[50vh]">
      <LoadingSpinner />
    </div>
  )

  const actions = (
    <Link to="/documents/upload">
      <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
        Upload PDF
      </Button>
    </Link>
  )

  const stats = [
    { label: 'Total Documents', value: data?.docCount || 0, icon: FileText, color: 'text-brand-600' },
    { label: 'Active Links', value: data?.activeLinks || 0, icon: LayoutGrid, color: 'text-emerald-600' },
    { label: 'Total Views', value: data?.totalViews || 0, icon: Clock, color: 'text-amber-600' },
  ];

  return (
    <div className="space-y-10">
      <SectionHeader 
        title="Dashboard" 
        description={`Manage your documents and track engagement in real-time.`}
        actions={actions}
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} padding="md" className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl bg-neutral-50 ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-500 uppercase tracking-wider leading-none mb-1">
                {stat.label}
              </p>
              <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900">Recent Documents</h2>
          <Link to="/smartlinks" className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors">
            View all documents
          </Link>
        </div>

        {data?.docs?.length === 0 ? (
          <Card padding="lg" className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-neutral-50 rounded-2xl flex items-center justify-center mb-6 border border-neutral-100 shadow-sm">
              <FileText className="w-8 h-8 text-neutral-300" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-2">No documents yet</h3>
            <p className="text-neutral-500 max-w-sm mx-auto mb-8 font-medium">
              Start by uploading your first PDF. We'll help you track views and capture leads effortlessly.
            </p>
            <Link to="/documents/upload">
              <Button variant="secondary">Upload your first PDF</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {data?.docs?.map((doc: any) => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
