import { useState, useEffect, useRef } from 'react'
import { getBrief } from '../../api/deals'

function timeAgo(dateStr: string) {
  if (!dateStr) return 'Never'
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
}

export default function ExecutiveBrief({ dealId }: { dealId: string }) {
  const [brief, setBrief] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const briefRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getBrief(dealId)
      .then(setBrief)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [dealId])

  const handleCopy = () => {
    if (!briefRef.current) return
    const text = briefRef.current.innerText
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) return <div className="flex items-center justify-center py-24"><div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>

  if (!brief) return <div className="text-center py-12"><p className="text-sm font-medium text-neutral-500">Failed to generate brief</p></div>

  const { overview, stakeholderMatrix, positiveSignals, negativeSignals, talkingPoints } = brief

  return (
    <div>
      <div className="flex items-center justify-end gap-2 mb-4">
        <button
          onClick={handleCopy}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${copied ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button onClick={handlePrint} className="px-4 py-2 rounded-lg text-sm font-bold bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors">
          Print
        </button>
      </div>

      <div ref={briefRef} className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-8 print:shadow-none print:border-none space-y-8">
        {/* Header */}
        <div className="border-b border-neutral-100 pb-6">
          <h2 className="text-2xl font-extrabold text-neutral-900 tracking-tight">{overview.accountName} — Executive Brief</h2>
          <p className="text-sm text-neutral-400 mt-1">Generated {new Date(brief.generatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>

        {/* Deal Overview */}
        <div>
          <h3 className="text-base font-bold text-neutral-900 mb-3">Deal Overview</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-neutral-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-neutral-400 uppercase">Stage</p>
              <p className="text-sm font-bold text-neutral-900 mt-0.5 capitalize">{overview.stage.replace('_', ' ')}</p>
            </div>
            <div className="bg-neutral-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-neutral-400 uppercase">Value</p>
              <p className="text-sm font-bold text-neutral-900 mt-0.5">{overview.value > 0 ? formatCurrency(overview.value, overview.currency) : 'N/A'}</p>
            </div>
            <div className="bg-neutral-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-neutral-400 uppercase">Days in Stage</p>
              <p className="text-sm font-bold text-neutral-900 mt-0.5">{overview.daysInStage}</p>
            </div>
            <div className="bg-neutral-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-neutral-400 uppercase">Health</p>
              <p className={`text-sm font-bold mt-0.5 capitalize ${overview.healthStatus === 'healthy' ? 'text-green-600' : overview.healthStatus === 'at_risk' ? 'text-amber-600' : 'text-red-600'}`}>
                {overview.healthStatus.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>

        {/* Stakeholder Matrix */}
        <div>
          <h3 className="text-base font-bold text-neutral-900 mb-3">Stakeholder Matrix</h3>
          {stakeholderMatrix.length === 0 ? (
            <p className="text-sm text-neutral-500">No stakeholders added</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left text-xs font-bold text-neutral-400 uppercase py-2 pr-4">Name</th>
                    <th className="text-left text-xs font-bold text-neutral-400 uppercase py-2 pr-4">Role</th>
                    <th className="text-left text-xs font-bold text-neutral-400 uppercase py-2 pr-4">Status</th>
                    <th className="text-left text-xs font-bold text-neutral-400 uppercase py-2 pr-4">Score</th>
                    <th className="text-left text-xs font-bold text-neutral-400 uppercase py-2">Last Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {stakeholderMatrix.map((s: any, i: number) => (
                    <tr key={i}>
                      <td className="py-2 pr-4 font-semibold text-neutral-900">{s.name}</td>
                      <td className="py-2 pr-4 text-neutral-600 capitalize">{s.role.replace('_', ' ')}</td>
                      <td className="py-2 pr-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${s.engaged ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>
                          {s.engaged ? 'Engaged' : 'Not engaged'}
                        </span>
                      </td>
                      <td className="py-2 pr-4 font-bold text-neutral-900">{s.score}</td>
                      <td className="py-2 text-neutral-500">{s.lastActivity ? timeAgo(s.lastActivity) : 'Never'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Key Signals */}
        <div>
          <h3 className="text-base font-bold text-neutral-900 mb-3">Key Signals</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">Positive</p>
              {positiveSignals.length === 0 ? (
                <p className="text-sm text-neutral-400 italic">None detected</p>
              ) : (
                <ul className="space-y-1.5">
                  {positiveSignals.map((s: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                      <span className="text-green-500 mt-0.5 flex-shrink-0">+</span>
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">Concerns</p>
              {negativeSignals.length === 0 ? (
                <p className="text-sm text-neutral-400 italic">None detected</p>
              ) : (
                <ul className="space-y-1.5">
                  {negativeSignals.map((s: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                      <span className="text-red-500 mt-0.5 flex-shrink-0">-</span>
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Talking Points */}
        {talkingPoints.length > 0 && (
          <div>
            <h3 className="text-base font-bold text-neutral-900 mb-3">Talking Points</h3>
            <ul className="space-y-2">
              {talkingPoints.map((tp: string, i: number) => (
                <li key={i} className="flex items-start gap-3 bg-brand-50 rounded-xl px-4 py-3">
                  <span className="text-brand-600 font-bold text-sm flex-shrink-0">{i + 1}.</span>
                  <span className="text-sm font-medium text-neutral-800">{tp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
