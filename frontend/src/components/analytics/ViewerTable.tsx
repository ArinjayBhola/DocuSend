import { formatDuration, timeAgo } from '../../utils/format'

export default function ViewerTable({ viewers }: { viewers: any }) {
  if (!viewers || viewers.length === 0) {
    return <div className="bg-white rounded-2xl border border-neutral-100 p-8 text-center text-neutral-400 font-medium shadow-sm">No viewers yet</div>
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-neutral-100 bg-neutral-50/50">
         <h3 className="text-lg font-bold text-neutral-900 tracking-tight">Recent Viewers</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-white">
            <tr>
              <th className="px-6 py-4 font-bold tracking-widest uppercase text-[10px] text-neutral-400 border-b border-neutral-100">Viewer</th>
              <th className="px-6 py-4 font-bold tracking-widest uppercase text-[10px] text-neutral-400 border-b border-neutral-100">Duration</th>
              <th className="px-6 py-4 font-bold tracking-widest uppercase text-[10px] text-neutral-400 border-b border-neutral-100">Pages</th>
              <th className="px-6 py-4 font-bold tracking-widest uppercase text-[10px] text-neutral-400 border-b border-neutral-100">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 bg-white">
            {viewers.map((v: any) => (
              <tr key={v.id} className="hover:bg-neutral-50 transition-colors duration-150">
                <td className="px-6 py-4 font-semibold text-neutral-900">{v.viewerEmail || v.viewerIp || 'Anonymous'}</td>
                <td className="px-6 py-4 font-medium text-neutral-600">{formatDuration(v.duration)}</td>
                <td className="px-6 py-4 font-medium text-neutral-600">
                  <span className="bg-neutral-100 text-neutral-700 px-2 py-1 rounded-md text-xs font-bold">
                     {v.pagesViewed} / {v.totalPages}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium text-neutral-600">{timeAgo(v.viewedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
