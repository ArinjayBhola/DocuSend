import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Copy, Check, BarChart3, Settings, FileText, Globe, Lock } from 'lucide-react'
import { formatBytes, formatDuration, timeAgo } from '../../utils/format'
import Badge from '../ui/Badge'
import Card from '../ui/Card'
import Button from '../ui/Button'

export default function DocumentCard({ doc }: { doc: any }) {
  const [copied, setCopied] = useState(false)
  const shareUrl = `${window.location.origin}/s/${doc.shareSlug}`

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card padding="none" hoverable className="flex flex-col h-full group">
      {/* Header Info */}
      <div className="p-6 pb-0">
        <div className="flex justify-between items-start mb-3 gap-3">
          <div className="p-2 bg-neutral-50 rounded-lg border border-neutral-100 group-hover:bg-brand-50 group-hover:border-brand-100 transition-colors">
            <FileText className="w-5 h-5 text-neutral-400 group-hover:text-brand-600" />
          </div>
          <Badge variant={doc.isActive ? 'success' : 'neutral'} size="sm">
            {doc.isActive ? 'Live' : 'Draft'}
          </Badge>
        </div>
        
        <h3 className="font-bold text-neutral-900 truncate leading-tight tracking-tight mb-1 group-hover:text-brand-600 transition-colors">
          {doc.title}
        </h3>
        <p className="text-xs font-semibold text-neutral-400 truncate mb-4">
          {doc.fileName} <span className="mx-1 text-neutral-200">|</span> {formatBytes(doc.fileSize)}
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="px-6 mb-6">
        <div className="grid grid-cols-3 gap-px bg-neutral-100 border border-neutral-100 rounded-xl overflow-hidden">
          <div className="bg-white p-3 text-center">
            <p className="text-lg font-bold text-neutral-900 leading-none">{doc.viewCount}</p>
            <p className="text-[10px] font-bold tracking-wider uppercase text-neutral-400 mt-1">Views</p>
          </div>
          <div className="bg-white p-3 text-center">
            <p className="text-lg font-bold text-neutral-900 leading-none">{formatDuration(doc.totalDuration)}</p>
            <p className="text-[10px] font-bold tracking-wider uppercase text-neutral-400 mt-1">Time</p>
          </div>
          <div className="bg-white p-3 text-center">
            <p className="text-sm font-bold text-neutral-900 leading-none mt-1">{doc.lastViewedAt ? timeAgo(doc.lastViewedAt).replace(' ago', '') : 'N/A'}</p>
            <p className="text-[10px] font-bold tracking-wider uppercase text-neutral-400 mt-1">Seen</p>
          </div>
        </div>
      </div>

      {/* Actions Section */}
      <div className="mt-auto p-6 pt-0 space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 group/copy">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="w-full text-[11px] font-semibold bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-neutral-500 focus:outline-none cursor-text truncate transition-all group-hover/copy:border-brand-300 group-hover/copy:bg-white"
              onClick={(e: any) => { e.target.select(); handleCopy() }}
            />
          </div>
          <Button 
            variant="secondary" 
            size="sm" 
            className="shrink-0 rounded-xl"
            onClick={handleCopy}
            leftIcon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-neutral-100">
           <Link to={`/documents/${doc.id}/analytics`} className="text-xs font-bold text-neutral-400 hover:text-brand-600 transition-colors flex items-center gap-1.5 uppercase tracking-wider">
             <BarChart3 className="w-3.5 h-3.5" /> Analytics
           </Link>
           <Link to={`/documents/${doc.id}/settings`} className="text-xs font-bold text-neutral-400 hover:text-neutral-900 transition-colors flex items-center gap-1.5 uppercase tracking-wider">
             <Settings className="w-3.5 h-3.5" /> Settings
           </Link>
        </div>
      </div>
    </Card>
  )
}
