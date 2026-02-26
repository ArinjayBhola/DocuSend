import { useState, useEffect } from 'react'
import { createSmartLink } from '../../api/smartlinks'
import { getDashboard } from '../../api/documents'

interface CreateLinkModalProps {
  onClose: () => void
  onCreate: () => void
  preselectedDocId?: number
}

export default function CreateLinkModal({ onClose, onCreate, preselectedDocId }: CreateLinkModalProps) {
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    documentId: preselectedDocId || 0,
    recipientEmail: '',
    recipientName: '',
    allowDownload: false,
    requirePassword: false,
    password: '',
    expiresAt: '',
    maxViews: '',
  })

  useEffect(() => {
    getDashboard().then((data: any) => {
      setDocs(data.docs || [])
      if (!preselectedDocId && data.docs?.length > 0) {
        setForm(f => ({ ...f, documentId: data.docs[0].id }))
      }
    }).catch(() => {})
  }, [preselectedDocId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.documentId || !form.recipientEmail) return
    setLoading(true)
    setError('')
    try {
      await createSmartLink({
        documentId: form.documentId,
        recipientEmail: form.recipientEmail,
        recipientName: form.recipientName || undefined,
        allowDownload: form.allowDownload,
        requirePassword: form.requirePassword,
        password: form.requirePassword ? form.password : undefined,
        expiresAt: form.expiresAt || undefined,
        maxViews: form.maxViews ? parseInt(form.maxViews) : undefined,
      })
      onCreate()
    } catch (err: any) {
      setError(err.message || 'Failed to create smart link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-100 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-neutral-100">
          <h2 className="text-lg font-bold text-neutral-900">Create Smart Link</h2>
          <p className="text-xs font-medium text-neutral-500 mt-1">Send a personalized trackable link to a specific recipient</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm font-medium text-red-700">{error}</div>
          )}

          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">Document</label>
            <select
              value={form.documentId}
              onChange={e => setForm({ ...form, documentId: parseInt(e.target.value) })}
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              required
            >
              <option value={0} disabled>Select a document</option>
              {docs.map((doc: any) => (
                <option key={doc.id} value={doc.id}>{doc.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">Recipient Email</label>
            <input
              type="email"
              value={form.recipientEmail}
              onChange={e => setForm({ ...form, recipientEmail: e.target.value })}
              placeholder="john@company.com"
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">Recipient Name (optional)</label>
            <input
              type="text"
              value={form.recipientName}
              onChange={e => setForm({ ...form, recipientName: e.target.value })}
              placeholder="John Smith"
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1">Expires</label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={e => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1">Max Views</label>
              <input
                type="number"
                value={form.maxViews}
                onChange={e => setForm({ ...form, maxViews: e.target.value })}
                placeholder="Unlimited"
                min="1"
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.allowDownload}
                onChange={e => setForm({ ...form, allowDownload: e.target.checked })}
                className="w-4 h-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm font-medium text-neutral-700">Allow download</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.requirePassword}
                onChange={e => setForm({ ...form, requirePassword: e.target.checked })}
                className="w-4 h-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm font-medium text-neutral-700">Require password</span>
            </label>
          </div>

          {form.requirePassword && (
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1">Password</label>
              <input
                type="text"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Enter password"
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                required
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-brand-600 text-white shadow-md shadow-brand-600/20 hover:bg-brand-700 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
