const severityConfig: Record<string, { bg: string; text: string; icon: string }> = {
  high: { bg: 'bg-red-50', text: 'text-red-700', icon: '!!' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-700', icon: '!' },
  low: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'i' },
}

export default function RiskPanel({ riskData }: { riskData: any }) {
  if (!riskData) return null

  const { riskScore, healthStatus, signals } = riskData
  const ringColor = healthStatus === 'healthy' ? '#22c55e' : healthStatus === 'at_risk' ? '#f59e0b' : '#ef4444'
  const circumference = 2 * Math.PI * 54
  const strokeDashoffset = circumference - (riskScore / 100) * circumference

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
      <h3 className="text-base font-bold text-neutral-900 tracking-tight mb-5">Risk Assessment</h3>

      <div className="flex items-center justify-center mb-6">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#f1f5f9" strokeWidth="8" />
            <circle cx="60" cy="60" r="54" fill="none" stroke={ringColor} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-700" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold text-neutral-900">{riskScore}</span>
            <span className="text-xs font-semibold text-neutral-400 uppercase">{healthStatus.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      {signals.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm font-medium text-green-600">No active risk signals detected</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {signals.map((sig: any, i: number) => {
            const c = severityConfig[sig.severity] || severityConfig.low
            return (
              <div key={i} className={`flex items-start gap-3 ${c.bg} rounded-xl px-4 py-3`}>
                <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${c.text} bg-white/60`}>
                  {c.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold uppercase ${c.text}`}>{sig.signal.replace(/_/g, ' ')}</span>
                    <span className={`text-xs font-bold ${c.text} opacity-60`}>{sig.penalty}</span>
                  </div>
                  <p className="text-sm font-medium text-neutral-700 mt-0.5">{sig.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
