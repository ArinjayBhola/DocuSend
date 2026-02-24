import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getPublicWorkspace } from '../api/workspaces'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { formatBytes } from '../utils/format'

export default function ShareWorkspace() {
  const { slug } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPublicWorkspace(slug)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Workspace Not Found</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      <div className="max-w-3xl mx-auto">
        
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white border border-neutral-100 shadow-sm rounded-2xl mb-6">
            <span className="text-3xl text-neutral-400">📁</span>
          </div>
          <h1 className="text-4xl font-extrabold text-neutral-900 tracking-tight">{data.workspace.name}</h1>
          {data.workspace.description && (
            <p className="text-lg font-medium text-neutral-500 mt-4 max-w-xl mx-auto">{data.workspace.description}</p>
          )}
        </div>

        <div className="bg-white rounded-3xl p-2 shadow-xl shadow-neutral-200/50 border border-neutral-100">
          <div className="bg-neutral-50 rounded-2xl p-6 sm:p-8">
            <h2 className="text-sm font-bold tracking-widest uppercase text-neutral-400 mb-6 px-1">Documents</h2>
            <div className="space-y-3">
              {data.documents.map((doc: any) => (
                <Link
                  key={doc.shareSlug}
                  to={`/s/${doc.shareSlug}`}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-xl border border-neutral-100 p-5 hover:border-neutral-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                >
                  <span className="font-bold text-neutral-900 truncate group-hover:text-brand-600 transition-colors">{doc.title}</span>
                  <span className="shrink-0 text-xs font-bold tracking-widest text-neutral-400 uppercase bg-neutral-50 px-3 py-1.5 rounded-lg group-hover:bg-neutral-100 transition-colors">
                    {formatBytes(doc.fileSize)}
                  </span>
                </Link>
              ))}
            </div>
            
            {data.documents.length === 0 && (
              <div className="text-center py-10">
                 <p className="text-sm font-medium text-neutral-500">No documents are available in this workspace yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-xs font-bold tracking-widest uppercase text-neutral-400">
            Powered by <span className="text-neutral-900">DocuSend</span>
          </p>
        </div>
      </div>
    </div>
  )
}
