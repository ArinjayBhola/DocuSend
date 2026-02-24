import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getDocument, updateDocument, deleteDocument } from '../api/documents'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { formatBytes } from '../utils/format'

export default function DocumentSettings() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [doc, setDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const shareUrl = `${window.location.origin}/s/${doc.shareSlug}`
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const [form, setForm] = useState({
    title: '', password: '', requireEmail: false,
    allowDownload: false, expiresAt: '', isActive: true,
  })

  useEffect(() => {
    getDocument(id)
      .then(data => {
        setDoc(data.document)
        setForm({
          title: data.document.title,
          password: data.document.password || '',
          requireEmail: !!data.document.requireEmail,
          allowDownload: !!data.document.allowDownload,
          expiresAt: data.document.expiresAt || '',
          isActive: !!data.document.isActive,
        })
      })
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const data = await updateDocument(id, form)
      setDoc(data.document)
      setSuccess('Settings saved!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this document?')) return
    try {
      await deleteDocument(id)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <LoadingSpinner />

  const shareUrl = `${window.location.origin}/s/${doc.shareSlug}`

  return (
    <div className="min-h-screen bg-neutral-50 px-4 sm:px-6 lg:px-8 pt-24 pb-10">
      <div className="max-w-3xl mx-auto">
        
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-2">
             <Link to="/dashboard" className="w-10 h-10 bg-white border border-neutral-200 rounded-xl flex items-center justify-center text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 hover:border-neutral-300 transition-all shadow-sm">
              &larr;
            </Link>
            <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Document Settings</h1>
          </div>
          <p className="text-sm font-semibold text-neutral-500 mt-2 ml-14">
            {doc.fileName} <span className="mx-1.5">&bull;</span> {formatBytes(doc.fileSize)}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50/50 border border-red-100 text-red-700 rounded-xl text-sm font-medium flex items-center gap-2">
            <span className="text-red-500 text-lg">&#9888;</span>
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-medium flex items-center gap-2">
            <span className="text-green-500 text-lg">&#10003;</span>
            {success}
          </div>
        )}

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 mb-8">
          <label className="block text-sm font-bold text-neutral-900 mb-3 tracking-tight">Share Link</label>
          <div className="flex items-center gap-3 group/link">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <span className="text-neutral-400">🔗</span>
              </div>
              <input 
                type="text" 
                readOnly 
                value={shareUrl} 
                className={`w-full text-sm font-medium bg-neutral-50 border rounded-xl pl-9 pr-4 py-3 text-neutral-600 focus:outline-none cursor-text truncate transition-colors shadow-inner ${copied ? 'border-green-300 bg-green-50/30' : 'border-neutral-200 group-hover/link:border-neutral-300'}`} 
                onClick={(e: any) => { e.target.select(); handleCopy() }} 
              />
            </div>
            <Button variant="secondary" onClick={handleCopy} className={`shrink-0 text-sm transition-all duration-300 w-28 ${copied ? '!bg-green-50 !text-green-700 !border-green-200 hover:!bg-green-100' : ''}`}>
              {copied ? '✓ Copied!' : 'Copy Link'}
            </Button>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-100">
          <form onSubmit={handleSave} className="space-y-6">
            <Input label="Document Title" value={form.title} required onChange={(e: any) => setForm({ ...form, title: e.target.value })} />

            <Input label="Password Protection (Optional)" type="text" value={form.password} onChange={(e: any) => setForm({ ...form, password: e.target.value })} placeholder="Leave empty for no password" />

            <div className="pt-2 border-t border-neutral-100">
              <div className="flex items-center gap-4 py-3 cursor-pointer group hover:bg-neutral-50 -mx-4 px-4 rounded-xl transition-colors">
                <input type="checkbox" id="requireEmail" checked={form.requireEmail} onChange={(e: any) => setForm({ ...form, requireEmail: e.target.checked })} className="w-5 h-5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer" />
                <label htmlFor="requireEmail" className="flex-1 text-sm font-semibold text-neutral-800 cursor-pointer select-none">Require email to view</label>
              </div>

              <div className="flex items-center gap-4 py-3 cursor-pointer group hover:bg-neutral-50 -mx-4 px-4 rounded-xl transition-colors">
                <input type="checkbox" id="allowDownload" checked={form.allowDownload} onChange={(e: any) => setForm({ ...form, allowDownload: e.target.checked })} className="w-5 h-5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer" />
                <label htmlFor="allowDownload" className="flex-1 text-sm font-semibold text-neutral-800 cursor-pointer select-none">Allow PDF download</label>
              </div>

              <div className="flex items-center gap-4 py-3 cursor-pointer group hover:bg-neutral-50 -mx-4 px-4 rounded-xl transition-colors mb-2">
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e: any) => setForm({ ...form, isActive: e.target.checked })} className="w-5 h-5 rounded border-neutral-300 text-green-600 focus:ring-green-600 cursor-pointer" />
                <label htmlFor="isActive" className="flex-1 text-sm font-semibold text-neutral-800 cursor-pointer select-none">Document is Live <span className="font-normal text-neutral-500 ml-1">(if unchecked, document shows as unavailable)</span></label>
              </div>
              
              <div className="mt-4">
                 <Input label="Expiration Date (Optional)" type="datetime-local" value={form.expiresAt} onChange={(e: any) => setForm({ ...form, expiresAt: e.target.value })} />
              </div>
            </div>

            <div className="pt-6 border-t border-neutral-100 flex justify-end">
              <Button type="submit" disabled={saving} className="w-full sm:w-auto px-8">
                {saving ? 'Saving Changes...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="mt-12">
          <div className="bg-red-50/50 border border-red-100 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <h3 className="text-base font-bold text-red-900 tracking-tight mb-1">Delete Document</h3>
              <p className="text-sm font-medium text-red-700/80">This action cannot be undone. All analytics will be lost.</p>
            </div>
            <Button variant="danger" onClick={handleDelete} className="shrink-0">
              Delete Document
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}
