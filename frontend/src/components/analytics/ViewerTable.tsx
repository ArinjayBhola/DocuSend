import { User, Clock, FileText, Calendar } from 'lucide-react'
import { formatDuration, timeAgo } from '../../utils/format'
import Badge from '../ui/Badge'

export default function ViewerTable({ viewers }: { viewers: any }) {
  if (!viewers || viewers.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="w-12 h-12 bg-neutral-50 rounded-xl flex items-center justify-center mb-4 mx-auto border border-neutral-100">
          <User className="w-6 h-6 text-neutral-300" />
        </div>
        <p className="text-neutral-500 font-bold">No viewers yet</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-separate border-spacing-0">
        <thead>
          <tr>
            <th className="px-6 py-4 font-bold tracking-widest uppercase text-[10px] text-neutral-400 border-b border-neutral-100 bg-neutral-50/50 rounded-tl-xl">
              <span className="flex items-center gap-1.5"><User className="w-3 h-3" /> Viewer</span>
            </th>
            <th className="px-6 py-4 font-bold tracking-widest uppercase text-[10px] text-neutral-400 border-b border-neutral-100 bg-neutral-50/50">
              <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> Time Spent</span>
            </th>
            <th className="px-6 py-4 font-bold tracking-widest uppercase text-[10px] text-neutral-400 border-b border-neutral-100 bg-neutral-50/50">
              <span className="flex items-center gap-1.5"><FileText className="w-3 h-3" /> Progress</span>
            </th>
            <th className="px-6 py-4 font-bold tracking-widest uppercase text-[10px] text-neutral-400 border-b border-neutral-100 bg-neutral-50/50 rounded-tr-xl">
              <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> When</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {viewers.map((v: any) => (
            <tr key={v.id} className="hover:bg-neutral-50/50 transition-colors duration-200 group">
              <td className="px-6 py-4 font-bold text-neutral-900 text-sm truncate max-w-[200px]">{v.viewerEmail || v.viewerIp || 'Anonymous'}</td>
              <td className="px-6 py-4 font-semibold text-neutral-600 text-sm whitespace-nowrap">{formatDuration(v.duration)}</td>
              <td className="px-6 py-4">
                <Badge variant={v.pagesViewed === v.totalPages ? 'success' : 'brand'} size="sm">
                   {v.pagesViewed} / {v.totalPages}
                </Badge>
              </td>
              <td className="px-6 py-4 font-semibold text-neutral-400 text-sm whitespace-nowrap">{timeAgo(v.viewedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
