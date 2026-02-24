import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createDeal } from '../api/deals'
import { get } from '../api/client'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

const STAGES = [
  { value: 'prospecting', label: 'Prospecting' },
  { value: 'discovery', label: 'Discovery' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
]

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD']

export default function DealNew() {
  const navigate = useNavigate()
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [form, setForm] = useState({
    workspaceId: '',
    accountName: '',
    stage: 'prospecting',
    value: '',
    currency: 'USD',
    closeDate: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    get('/workspaces').then(d => setWorkspaces(d.workspaces || [])).catch(() => {})
  }, [])

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    if (!form.workspaceId || !form.accountName) {
      setError('Please select a workspace and enter an account name.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const deal = await createDeal({
        workspaceId: Number(form.workspaceId),
        accountName: form.accountName,
        stage: form.stage,
        value: form.value ? Number(form.value) : 0,
        currency: form.currency,
        closeDate: form.closeDate || null,
      })
      navigate(`/deals/${deal.deal.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create deal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 pt-28 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-neutral-100 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-brand-600"></div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">New Deal</h1>
            <p className="mt-2 text-sm text-neutral-500 font-medium">Link a workspace to start tracking deal intelligence.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50/50 border border-red-100 text-red-700 rounded-xl text-sm font-medium flex items-center gap-2">
              <span className="text-red-500 text-lg">&#9888;</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-neutral-800 mb-1.5">Workspace</label>
              <select
                required
                value={form.workspaceId}
                onChange={(e) => setForm({ ...form, workspaceId: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 shadow-sm"
              >
                <option value="">Select a workspace...</option>
                {workspaces.map((ws: any) => (
                  <option key={ws.id} value={ws.id}>{ws.name}</option>
                ))}
              </select>
            </div>

            <Input
              label="Account Name"
              required
              placeholder="Acme Corp"
              value={form.accountName}
              onChange={(e: any) => setForm({ ...form, accountName: e.target.value })}
            />

            <div>
              <label className="block text-sm font-semibold text-neutral-800 mb-1.5">Stage</label>
              <select
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 shadow-sm"
              >
                {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Input
                  label="Deal Value"
                  type="number"
                  placeholder="50000"
                  value={form.value}
                  onChange={(e: any) => setForm({ ...form, value: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-800 mb-1.5">Currency</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full px-3 py-3 bg-white border border-neutral-200 rounded-xl text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 shadow-sm"
                >
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-800 mb-1.5">Expected Close Date <span className="text-neutral-400 font-normal">(optional)</span></label>
              <input
                type="date"
                value={form.closeDate}
                onChange={(e) => setForm({ ...form, closeDate: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 shadow-sm"
              />
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button type="button" variant="ghost" className="w-full" onClick={() => navigate('/deals')}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Creating...' : 'Create Deal'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
