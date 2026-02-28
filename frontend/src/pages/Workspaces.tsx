import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FolderPlus, Folder, Clock, ChevronRight } from 'lucide-react'
import { getWorkspaces } from '../api/workspaces'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { timeAgo } from '../utils/format'
import SectionHeader from '../components/ui/SectionHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'

export default function Workspaces() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getWorkspaces()
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
    <Link to="/workspaces/new">
      <Button variant="primary" leftIcon={<FolderPlus className="w-4 h-4" />}>
        New Workspace
      </Button>
    </Link>
  )

  return (
    <div className="space-y-10">
      <SectionHeader 
        title="Workspaces" 
        description="Organize your documents into shared folders and manage group access."
        actions={actions}
      />

      {!data?.workspaces?.length ? (
        <Card padding="lg" className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-neutral-50 rounded-2xl flex items-center justify-center mb-6 border border-neutral-100 shadow-sm">
            <Folder className="w-8 h-8 text-neutral-300" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 mb-2">No workspaces yet</h3>
          <p className="text-neutral-500 max-w-sm mx-auto mb-8 font-medium">
            Group your documents to share them securely via a single link. Great for deals, projects, or portfolios.
          </p>
          <Link to="/workspaces/new">
            <Button variant="secondary">Create your first workspace</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {data.workspaces.map((ws: any) => (
            <Link key={ws.id} to={`/workspaces/${ws.id}`}>
              <Card padding="none" hoverable className="flex flex-col h-full group border-neutral-200">
                <div className="p-6 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center mb-4 group-hover:bg-brand-600 transition-all duration-300">
                    <Folder className="w-5 h-5 text-brand-600 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-2 truncate group-hover:text-brand-600 transition-colors">
                    {ws.name}
                  </h3>
                  <p className="text-sm font-medium text-neutral-500 line-clamp-2 min-h-[40px] leading-relaxed">
                    {ws.description || 'No description provided for this workspace.'}
                  </p>
                </div>
                
                <div className="px-6 py-4 bg-neutral-50/50 border-t border-neutral-100 flex items-center justify-between">
                  <Badge variant="neutral" size="sm">
                    {ws.docCount} Document{ws.docCount !== 1 ? 's' : ''}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    <Clock className="w-3 h-3" />
                    {timeAgo(ws.createdAt).replace(' ago', '')}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
