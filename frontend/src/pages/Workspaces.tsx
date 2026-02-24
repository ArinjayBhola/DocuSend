import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getWorkspaces } from '../api/workspaces'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { timeAgo } from '../utils/format'

export default function Workspaces() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getWorkspaces()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="min-h-screen bg-neutral-50 px-4 sm:px-6 lg:px-8 pt-24 pb-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Workspaces</h1>
            <p className="text-sm font-medium text-neutral-500 mt-1">Manage grouped documents and sharing</p>
          </div>
          <Link
            to="/workspaces/new"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-semibold bg-brand-600 text-white shadow-md shadow-brand-600/20 hover:bg-brand-700 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            New Workspace
          </Link>
        </div>

        {!data?.workspaces?.length ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-neutral-100 shadow-sm flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-neutral-50 rounded-2xl flex items-center justify-center mb-4">
              <span className="text-3xl text-neutral-400">📁</span>
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-1">No workspaces yet</h3>
            <p className="text-sm text-neutral-500 mb-6 font-medium">Group your documents to share them securely via a single link.</p>
            <Link to="/workspaces/new" className="text-brand-600 font-semibold hover:text-brand-700 hover:underline underline-offset-4 transition-all">
              Create your first workspace
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.workspaces.map((ws: any) => (
              <Link key={ws.id} to={`/workspaces/${ws.id}`} className="group bg-white rounded-2xl border border-neutral-100 p-6 flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <h3 className="text-lg font-bold text-neutral-900 mb-2 truncate group-hover:text-brand-600 transition-colors">
                  {ws.name}
                </h3>
                <p className="text-sm font-medium text-neutral-500 mb-6 line-clamp-2 min-h-[40px]">
                  {ws.description || 'No description provided.'}
                </p>
                <div className="mt-auto pt-4 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-xs font-bold tracking-widest uppercase text-neutral-400 bg-neutral-50 px-2.5 py-1 rounded-md">
                    {ws.docCount} Doc{ws.docCount !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xs font-semibold text-neutral-400">
                    {timeAgo(ws.createdAt).replace(' ago', '')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
