import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getWorkspace, addDocument, removeDocument, deleteWorkspace } from '../api/workspaces'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Button from '../components/ui/Button'
import { formatBytes } from '../utils/format'

export default function WorkspaceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!data?.workspace) return
    const shareUrl = `${window.location.origin}/w/${data.workspace.slug}`
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const loadData = () => {
    getWorkspace(id)
      .then(setData)
      .catch(() => navigate('/workspaces'))
      .finally(() => setLoading(false))
  }

  useEffect(loadData, [id, navigate])

  const handleAddDoc = async () => {
    if (!selectedDoc) return
    await addDocument(id, selectedDoc)
    setSelectedDoc('')
    setShowAdd(false)
    loadData()
  }

  const handleRemoveDoc = async (wdId) => {
    await removeDocument(id, wdId)
    loadData()
  }

  const handleDelete = async () => {
    if (!confirm('Delete this workspace?')) return
    await deleteWorkspace(id)
    navigate('/workspaces')
  }

  if (loading) return <LoadingSpinner />

  const shareUrl = `${window.location.origin}/w/${data.workspace.slug}`

  return (
    <div className="min-h-screen bg-neutral-50 px-4 sm:px-6 lg:px-8 pt-24 pb-10">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-2">
            <Link to="/workspaces" className="w-10 h-10 bg-white border border-neutral-200 rounded-xl flex items-center justify-center text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 hover:border-neutral-300 transition-all shadow-sm">
              &larr;
            </Link>
            <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">{data.workspace.name}</h1>
          </div>
          {data.workspace.description && <p className="text-sm font-medium text-neutral-500 ml-14 mt-1">{data.workspace.description}</p>}
        </div>

        {/* Share Link Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 mb-8">
          <label className="block text-sm font-bold text-neutral-900 mb-3 tracking-tight">Public Workspace Link</label>
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

        {/* Documents Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Workspace Documents</h2>
            <Button onClick={() => setShowAdd(!showAdd)} className="text-sm">
              {showAdd ? 'Cancel' : 'Add Document'}
            </Button>
          </div>

          {showAdd && (
            <div className="mb-6 p-6 bg-white border border-neutral-100 shadow-sm rounded-2xl flex flex-col sm:flex-row gap-4">
              <select
                className="flex-1 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200"
                value={selectedDoc}
                onChange={(e: any) => setSelectedDoc(e.target.value)}
              >
                <option value="">Select a document to add...</option>
                {data.allDocs.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
              <Button onClick={handleAddDoc} disabled={!selectedDoc}>Add to Workspace</Button>
            </div>
          )}

          {data.documents.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-neutral-100 shadow-sm flex flex-col items-center justify-center">
               <div className="w-16 h-16 bg-neutral-50 rounded-2xl flex items-center justify-center mb-4">
                 <span className="text-3xl text-neutral-400">📄</span>
               </div>
               <p className="text-lg font-bold text-neutral-900 mb-1">No documents yet</p>
               <p className="text-sm font-medium text-neutral-500">Add documents to this workspace to share them.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.documents.map((doc: any) => (
                <div key={doc.id} className="bg-white border border-neutral-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col">
                    <span className="font-bold text-neutral-900 tracking-tight">{doc.title}</span>
                    <span className="text-sm font-semibold tracking-wide text-neutral-400 mt-0.5">{formatBytes(doc.fileSize)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-neutral-100">
                    <Link to={`/documents/${doc.docId}/analytics`} className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 hover:text-neutral-900 transition-colors">
                      Stats
                    </Link>
                    <button onClick={() => handleRemoveDoc(doc.id)} className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-red-50 text-red-600 rounded-lg hover:bg-red-100 hover:text-red-700 transition-colors">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="mt-12 pt-8 border-t border-neutral-200">
          <div className="bg-red-50/50 border border-red-100 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <h3 className="text-base font-bold text-red-900 tracking-tight mb-1">Delete Workspace</h3>
              <p className="text-sm font-medium text-red-700/80 hover:text-red-700 transition-colors">This action cannot be undone. Documents within will not be deleted.</p>
            </div>
            <Button variant="danger" onClick={handleDelete} className="shrink-0">
              Delete Workspace
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
