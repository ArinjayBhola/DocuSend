import { useState } from 'react'
import { addStakeholder, updateStakeholder, removeStakeholder, detectStakeholders } from '../../api/deals'

const ROLES = ['champion', 'decision_maker', 'influencer', 'blocker', 'legal', 'technical']

const roleColors: Record<string, string> = {
  champion: 'bg-green-50 text-green-700 border-green-200',
  decision_maker: 'bg-purple-50 text-purple-700 border-purple-200',
  influencer: 'bg-blue-50 text-blue-700 border-blue-200',
  blocker: 'bg-red-50 text-red-700 border-red-200',
  legal: 'bg-amber-50 text-amber-700 border-amber-200',
  technical: 'bg-cyan-50 text-cyan-700 border-cyan-200',
}

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

export default function StakeholderTable({ dealId, stakeholders, riskData, onUpdate }: { dealId: string; stakeholders: any[]; riskData: any; onUpdate: () => void }) {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', role: 'influencer' })
  const [detecting, setDetecting] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editRole, setEditRole] = useState('')

  const scores = riskData?.stakeholderScores || []

  const getScore = (email: string) => {
    const s = scores.find((sc: any) => sc.email?.toLowerCase() === email?.toLowerCase())
    return s ? { score: s.score, viewCount: s.viewCount, lastView: s.lastView } : { score: 0, viewCount: 0, lastView: null }
  }

  const handleAdd = async (e: any) => {
    e.preventDefault()
    if (!form.name || !form.email) return
    try {
      await addStakeholder(dealId, form)
      setForm({ name: '', email: '', role: 'influencer' })
      setShowAdd(false)
      onUpdate()
    } catch { /* ignore */ }
  }

  const handleRoleUpdate = async (sid: number, role: string) => {
    try {
      await updateStakeholder(dealId, String(sid), { role })
      setEditingId(null)
      onUpdate()
    } catch { /* ignore */ }
  }

  const handleRemove = async (sid: number) => {
    if (!confirm('Remove this stakeholder?')) return
    try {
      await removeStakeholder(dealId, String(sid))
      onUpdate()
    } catch { /* ignore */ }
  }

  const handleDetect = async () => {
    setDetecting(true)
    try {
      const result = await detectStakeholders(dealId)
      if (result.detected > 0) onUpdate()
      else alert('No new stakeholders detected from document views.')
    } catch { /* ignore */ }
    setDetecting(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
        <h3 className="text-base font-bold text-neutral-900 tracking-tight">Stakeholders</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDetect}
            disabled={detecting}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors disabled:opacity-50"
          >
            {detecting ? 'Scanning...' : 'Auto-detect'}
          </button>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-600 text-white hover:bg-brand-700 transition-colors"
          >
            {showAdd ? 'Cancel' : 'Add'}
          </button>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="px-6 py-4 bg-neutral-50 border-b border-neutral-100 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-semibold text-neutral-500 mb-1">Name</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jane Smith" className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-semibold text-neutral-500 mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jane@company.com" className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
          </div>
          <div className="w-40">
            <label className="block text-xs font-semibold text-neutral-500 mb-1">Role</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500">
              {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
            </select>
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg text-sm font-bold bg-brand-600 text-white hover:bg-brand-700 transition-colors">Add</button>
        </form>
      )}

      {stakeholders.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <p className="text-sm font-medium text-neutral-500">No stakeholders yet. Add manually or use auto-detect.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="text-left text-xs font-bold text-neutral-400 uppercase tracking-wider px-6 py-3">Name</th>
                <th className="text-left text-xs font-bold text-neutral-400 uppercase tracking-wider px-4 py-3">Role</th>
                <th className="text-left text-xs font-bold text-neutral-400 uppercase tracking-wider px-4 py-3">Score</th>
                <th className="text-left text-xs font-bold text-neutral-400 uppercase tracking-wider px-4 py-3">Views</th>
                <th className="text-left text-xs font-bold text-neutral-400 uppercase tracking-wider px-4 py-3">Last Active</th>
                <th className="text-right text-xs font-bold text-neutral-400 uppercase tracking-wider px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {stakeholders.map((s: any) => {
                const { score, viewCount, lastView } = getScore(s.email)
                return (
                  <tr key={s.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-brand-700">{s.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">{s.name}</p>
                          <p className="text-xs text-neutral-400">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {editingId === s.id ? (
                        <select
                          value={editRole}
                          onChange={e => { handleRoleUpdate(s.id, e.target.value) }}
                          onBlur={() => setEditingId(null)}
                          autoFocus
                          className="px-2 py-1 rounded-lg border border-neutral-200 text-xs bg-white focus:outline-none"
                        >
                          {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                        </select>
                      ) : (
                        <button
                          onClick={() => { setEditingId(s.id); setEditRole(s.role) }}
                          className={`inline-flex px-2 py-0.5 rounded-md text-xs font-bold border ${roleColors[s.role] || 'bg-neutral-50 text-neutral-600 border-neutral-200'} hover:opacity-80 transition-opacity`}
                        >
                          {s.role.replace('_', ' ')}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-400'}`} style={{ width: `${score}%` }} />
                        </div>
                        <span className="text-xs font-bold text-neutral-600">{score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-neutral-600">{viewCount}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-neutral-500">{lastView ? timeAgo(lastView) : 'Never'}</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button onClick={() => handleRemove(s.id)} className="text-neutral-300 hover:text-red-500 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
