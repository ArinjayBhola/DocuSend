import { useState } from 'react'
import { Link } from 'react-router-dom'
import { updateSmartLink, deleteSmartLink, duplicateSmartLink } from '../../api/smartlinks'

interface LinkCardProps {
  link: {
    id: number
    slug: string
    recipientEmail: string
    recipientName: string | null
    documentTitle: string
    documentId: number
    isActive: boolean
    allowDownload: boolean
    viewCount: number
    maxViews: number | null
    expiresAt: string | null
    lastViewedAt: string | null
    totalDuration: number
    totalPagesViewed: number
    totalPages: number
    uniqueVisits: number
    createdAt: string
  }
  onRefresh: () => void
}

function formatDuration(seconds: number) {
  if (!seconds || seconds < 1) return '0s'
  if (seconds < 60) return `${Math.round(seconds)}s`
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins}m ${Math.round(seconds % 60)}s`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return 'Never'
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

export default function LinkCard({ link, onRefresh }: LinkCardProps) {
  const [copied, setCopied] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const shareUrl = `${window.location.origin}/s/${link.slug}`

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleToggleActive = async () => {
    await updateSmartLink(link.id, { isActive: !link.isActive })
    onRefresh()
    setMenuOpen(false)
  }

  const handleDuplicate = async () => {
    await duplicateSmartLink(link.id)
    onRefresh()
    setMenuOpen(false)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this smart link? Views will no longer be tracked.')) return
    await deleteSmartLink(link.id)
    onRefresh()
  }

  const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date()
  const isViewLimitReached = link.maxViews && link.viewCount >= link.maxViews
  const completionPct = link.totalPages > 0 ? Math.round((link.totalPagesViewed / link.totalPages) * 100) : 0

  let statusColor = 'bg-emerald-500'
  let statusLabel = 'Active'
  if (!link.isActive) { statusColor = 'bg-neutral-400'; statusLabel = 'Revoked' }
  else if (isExpired) { statusColor = 'bg-red-500'; statusLabel = 'Expired' }
  else if (isViewLimitReached) { statusColor = 'bg-amber-500'; statusLabel = 'Limit Reached' }

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-5 transition-all hover:shadow-md ${!link.isActive ? 'border-neutral-200 opacity-70' : 'border-neutral-100'}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-brand-700">
              {link.recipientEmail.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-900 truncate">
              {link.recipientName || link.recipientEmail}
            </p>
            {link.recipientName && (
              <p className="text-xs font-medium text-neutral-500 truncate">{link.recipientEmail}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold text-white ${statusColor}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
            {statusLabel}
          </span>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
              </svg>
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-8 z-20 bg-white border border-neutral-200 rounded-xl shadow-lg py-1 w-40">
                  <button onClick={handleToggleActive} className="w-full px-3 py-2 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                    {link.isActive ? 'Revoke' : 'Reactivate'}
                  </button>
                  <button onClick={handleDuplicate} className="w-full px-3 py-2 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                    Duplicate
                  </button>
                  <button onClick={handleDelete} className="w-full px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50">
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Document */}
      <Link
        to={`/documents/${link.documentId}/analytics`}
        className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline underline-offset-4 transition-all"
      >
        {link.documentTitle}
      </Link>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mt-3 mb-3">
        <div>
          <p className="text-xs font-medium text-neutral-500">Views</p>
          <p className="text-sm font-bold text-neutral-900">
            {link.viewCount}{link.maxViews ? ` / ${link.maxViews}` : ''}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-neutral-500">Time Spent</p>
          <p className="text-sm font-bold text-neutral-900">{formatDuration(link.totalDuration)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-neutral-500">Last Viewed</p>
          <p className="text-sm font-bold text-neutral-900">{timeAgo(link.lastViewedAt)}</p>
        </div>
      </div>

      {/* Completion bar */}
      {link.totalPages > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs font-medium text-neutral-500 mb-1">
            <span>Completion</span>
            <span>{completionPct}%</span>
          </div>
          <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Copy link */}
      <button
        onClick={handleCopy}
        className={`w-full mt-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
          copied
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-neutral-50 text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
        }`}
      >
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
    </div>
  )
}
