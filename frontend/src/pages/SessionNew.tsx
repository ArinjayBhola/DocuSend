import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSession } from '../api/sessions'
import { getDashboard } from '../api/documents'

export default function SessionNew() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [documentId, setDocumentId] = useState<number | ''>('')
  const [maxParticipants, setMaxParticipants] = useState(5)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [docsLoading, setDocsLoading] = useState(true)

  useEffect(() => {
    getDashboard()
      .then(data => setDocuments(data.documents || []))
      .catch(console.error)
      .finally(() => setDocsLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!documentId || !title.trim()) return
    setLoading(true)
    setError('')
    try {
      const { session } = await createSession({
        documentId: documentId as number,
        title: title.trim(),
        maxParticipants,
      })
      navigate(`/sessions/${session.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create session')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-4 sm:px-6 lg:px-8 pt-24 pb-10">
      <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-neutral-900 mb-1">New Session</h1>
      <p className="text-sm text-neutral-500 mb-6">Create a collaborative session to review a document with your team.</p>

      <form onSubmit={handleSubmit} className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Session Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g., Q4 Proposal Review"
            className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Document</label>
          {docsLoading ? (
            <div className="text-sm text-neutral-400 py-2">Loading documents...</div>
          ) : (
            <select
              value={documentId}
              onChange={e => setDocumentId(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm bg-white"
              required
            >
              <option value="">Select a document</option>
              {documents.map(doc => (
                <option key={doc.id} value={doc.id}>{doc.title}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Max Participants</label>
          <select
            value={maxParticipants}
            onChange={e => setMaxParticipants(Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm bg-white"
          >
            {[2, 3, 4, 5, 8, 10].map(n => (
              <option key={n} value={n}>{n} participants</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/sessions')}
            className="flex-1 px-4 py-2.5 rounded-lg border border-neutral-300 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !title.trim() || !documentId}
            className="flex-1 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 shadow-md shadow-brand-600/20 transition-colors"
          >
            {loading ? 'Creating...' : 'Create Session'}
          </button>
        </div>
      </form>
      </div>
    </div>
  )
}
