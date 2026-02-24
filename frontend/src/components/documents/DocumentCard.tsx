import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatBytes, formatDuration, timeAgo } from '../../utils/format'

export default function DocumentCard({ doc }: { doc: any }) {
  const [copied, setCopied] = useState(false)
  const shareUrl = `${window.location.origin}/s/${doc.shareSlug}`

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group bg-white rounded-2xl border border-neutral-100 p-6 flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      
      <div className="flex justify-between items-start mb-4 gap-3">
        <h3 className="font-bold text-neutral-900 truncate flex-1 leading-tight tracking-tight">
          {doc.title}
        </h3>
        <span className={`shrink-0 px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold ${doc.isActive ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>
          {doc.isActive ? 'Live' : 'Draft'}
        </span>
      </div>

      <div className="text-xs font-medium text-neutral-400 mb-6 bg-neutral-50 px-3 py-1.5 rounded-lg w-fit">
        <span className="truncate max-w-[120px] inline-block align-bottom">{doc.fileName}</span> <span className="mx-1">&bull;</span> {formatBytes(doc.fileSize)}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6 text-center bg-neutral-50 rounded-xl p-3 border border-neutral-100/50">
        <div className="flex flex-col items-center">
          <div className="text-lg font-bold text-neutral-900">{doc.viewCount}</div>
          <div className="text-[10px] font-semibold tracking-wider uppercase text-neutral-400">Views</div>
        </div>
        <div className="flex flex-col items-center border-l w-full border-neutral-200">
          <div className="text-lg font-bold text-neutral-900">{formatDuration(doc.totalDuration)}</div>
          <div className="text-[10px] font-semibold tracking-wider uppercase text-neutral-400">Time</div>
        </div>
        <div className="flex flex-col items-center border-l w-full border-neutral-200">
          <div className="text-sm font-bold text-neutral-900 mt-0.5">{doc.lastViewedAt ? timeAgo(doc.lastViewedAt).replace(' ago', '') : 'N/A'}</div>
          <div className="text-[10px] font-semibold tracking-wider uppercase text-neutral-400 mt-[3px]">Seen</div>
        </div>
      </div>

      <div className="mt-auto space-y-4">
        <div className="flex items-center gap-2 group/copy">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 text-xs font-medium bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-500 focus:outline-none cursor-text truncate transition-colors group-hover/copy:border-neutral-300"
            onClick={(e: any) => { e.target.select(); handleCopy() }}
          />
          <button
            onClick={handleCopy}
            className={`text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex items-center justify-center min-w-[64px] ${copied ? 'bg-green-50 text-green-600' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'}`}
          >
            {copied ? <span className="flex items-center gap-1"><span className="text-[10px]">&#10003;</span> Copied!</span> : 'Copy'}
          </button>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-neutral-100">
           <Link to={`/documents/${doc.id}/analytics`} className="text-sm font-semibold text-neutral-600 hover:text-brand-600 transition-colors flex items-center gap-1">
             <span className="text-base">📊</span> Analytics
           </Link>
           <Link to={`/documents/${doc.id}/settings`} className="text-sm font-semibold text-neutral-600 hover:text-neutral-900 transition-colors flex items-center gap-1">
             <span className="text-base">⚙️</span> Settings
           </Link>
        </div>
      </div>

    </div>
  )
}
