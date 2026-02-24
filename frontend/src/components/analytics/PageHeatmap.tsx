export default function PageHeatmap({ data }: { data: any }) {
  if (!data || data.length === 0) {
    return <div className="bg-white rounded-2xl border border-neutral-100 p-8 text-center text-neutral-400 font-medium shadow-sm">No page data yet</div>
  }

  const maxTime = Math.max(...data.map((d: any) => d.totalTime || 0))

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-neutral-900 mb-6 tracking-tight">Page Engagement</h3>
      <div className="space-y-4">
        {data.map((page: any) => {
          const pct = maxTime > 0 ? ((page.totalTime || 0) / maxTime) * 100 : 0
          return (
            <div key={page.pageNumber} className="flex items-center gap-4">
              <span className="text-[11px] font-bold tracking-widest uppercase text-neutral-500 w-16 shrink-0">Pg {page.pageNumber}</span>
              <div className="flex-1 bg-neutral-100 rounded-full h-3 overflow-hidden shadow-inner">
                <div
                  className="bg-neutral-900 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-neutral-500 w-24 text-right shrink-0">
                {((page.totalTime || 0) / 1000).toFixed(0)}s <span className="text-neutral-300 mx-1">&bull;</span> {page.viewCount}x
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
