import { useState, useEffect } from 'react'
import { getIntentGraph } from '../../api/deals'

export default function IntentGraph({ dealId }: { dealId: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getIntentGraph(dealId)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [dealId])

  if (loading) return <div className="flex items-center justify-center py-24"><div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>

  if (!data || (!data.stakeholderNodes.length && !data.documentNodes.length)) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-10 text-center">
        <p className="text-sm font-medium text-neutral-500">No engagement data to visualize yet. Add stakeholders and share documents to see the intent graph.</p>
      </div>
    )
  }

  const WIDTH = 850
  const sNodes = data.stakeholderNodes
  const dNodes = data.documentNodes
  const sSpacing = Math.max(80, (sNodes.length > 1 ? 420 / (sNodes.length - 1) : 0))
  const dSpacing = Math.max(80, (dNodes.length > 1 ? 420 / (dNodes.length - 1) : 0))
  const svgHeight = Math.max(500, Math.max(sNodes.length, dNodes.length) * 90 + 80)
  const sX = 170
  const dX = 680

  const tierColor = (tier: string) => tier === 'hot' ? '#ef4444' : tier === 'warm' ? '#f59e0b' : '#60a5fa'

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6 overflow-x-auto">
      <h3 className="text-base font-bold text-neutral-900 tracking-tight mb-4">Intent Graph</h3>
      <svg viewBox={`0 0 ${WIDTH} ${svgHeight}`} className="w-full" style={{ minWidth: 600 }}>
        {/* Labels */}
        <text x={sX} y={30} textAnchor="middle" className="fill-neutral-400 text-xs font-semibold" fontSize={12}>STAKEHOLDERS</text>
        <text x={dX} y={30} textAnchor="middle" className="fill-neutral-400 text-xs font-semibold" fontSize={12}>DOCUMENTS</text>

        {/* Edges */}
        {data.edges.map((edge: any, i: number) => {
          const sIdx = sNodes.findIndex((n: any) => n.id === edge.source)
          const dIdx = dNodes.findIndex((n: any) => n.id === edge.target)
          if (sIdx < 0 || dIdx < 0) return null
          const sy = 60 + sIdx * sSpacing + (sNodes.length === 1 ? svgHeight / 2 - 60 : 0)
          const dy = 60 + dIdx * dSpacing + (dNodes.length === 1 ? svgHeight / 2 - 60 : 0)
          const thickness = Math.min(6, Math.max(1, edge.timeSpent / 60))
          const opacity = Math.max(0.15, Math.min(0.8, (edge.completion || 0) / 100))
          const cp1x = sX + 180
          const cp2x = dX - 180
          return (
            <path
              key={i}
              d={`M ${sX + 45} ${sy} C ${cp1x} ${sy}, ${cp2x} ${dy}, ${dX - 80} ${dy}`}
              fill="none"
              stroke="#94a3b8"
              strokeWidth={thickness}
              opacity={opacity}
            />
          )
        })}

        {/* Stakeholder nodes */}
        {sNodes.map((node: any, i: number) => {
          const y = 60 + i * sSpacing + (sNodes.length === 1 ? svgHeight / 2 - 60 : 0)
          const radius = Math.max(24, Math.min(40, 24 + (node.score / 100) * 16))
          const color = tierColor(node.tier)
          return (
            <g key={node.id}>
              <circle cx={sX} cy={y} r={radius} fill={color} opacity={0.15} stroke={color} strokeWidth={2} />
              <circle cx={sX} cy={y} r={radius - 8} fill={color} opacity={0.3} />
              <text x={sX} y={y + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill={color}>{node.score}</text>
              <text x={sX - radius - 10} y={y - 6} textAnchor="end" fontSize={12} fontWeight={600} className="fill-neutral-800">{node.name}</text>
              <text x={sX - radius - 10} y={y + 10} textAnchor="end" fontSize={10} className="fill-neutral-400">{node.role.replace('_', ' ')}</text>
            </g>
          )
        })}

        {/* Document nodes */}
        {dNodes.map((node: any, i: number) => {
          const y = 60 + i * dSpacing + (dNodes.length === 1 ? svgHeight / 2 - 60 : 0)
          const title = node.title.length > 22 ? node.title.slice(0, 20) + '...' : node.title
          return (
            <g key={node.id}>
              <rect x={dX - 75} y={y - 22} width={150} height={44} rx={10} fill="#f8fafc" stroke="#e2e8f0" strokeWidth={1.5} />
              <text x={dX} y={y + 1} textAnchor="middle" fontSize={11} fontWeight={600} className="fill-neutral-700">{title}</text>
              <text x={dX} y={y + 15} textAnchor="middle" fontSize={9} className="fill-neutral-400">{node.totalViews} view{node.totalViews !== 1 ? 's' : ''}</text>
            </g>
          )
        })}
      </svg>

      <div className="flex items-center gap-6 mt-4 pt-4 border-t border-neutral-100">
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500" /><span className="text-xs font-medium text-neutral-500">Hot (70+)</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500" /><span className="text-xs font-medium text-neutral-500">Warm (40-69)</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-400" /><span className="text-xs font-medium text-neutral-500">Cold (&lt;40)</span></div>
        <div className="flex items-center gap-2 ml-auto"><span className="text-xs font-medium text-neutral-400">Line thickness = time spent, opacity = completion</span></div>
      </div>
    </div>
  )
}
