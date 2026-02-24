import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard } from '../api/documents'
import DocumentCard from '../components/documents/DocumentCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboard()
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
            <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Dashboard</h1>
            <p className="text-sm font-medium text-neutral-500 mt-1">
              {data.docCount} document{data.docCount !== 1 ? 's' : ''}
              {data.limits.documents !== Infinity && ` / ${data.limits.documents} limit`}
            </p>
          </div>
          <Link
            to="/documents/upload"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-semibold bg-brand-600 text-white shadow-md shadow-brand-600/20 hover:bg-brand-700 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            Upload PDF
          </Link>
        </div>

        {data.docs.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-neutral-100 shadow-sm flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-neutral-50 rounded-2xl flex items-center justify-center mb-4">
              <span className="text-3xl text-neutral-400">📄</span>
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-1">No documents yet</h3>
            <p className="text-sm text-neutral-500 mb-6 font-medium">Upload your first PDF to get started with DocuSend.</p>
            <Link to="/documents/upload" className="text-brand-600 font-semibold hover:text-brand-700 hover:underline underline-offset-4 transition-all">
              Upload your first PDF
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.docs.map((doc: any) => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
