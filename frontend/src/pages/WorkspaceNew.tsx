import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createWorkspace } from '../api/workspaces'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function WorkspaceNew() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', description: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await createWorkspace(form)
      navigate('/workspaces')
    } catch (err) {
      setError(err.message)
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
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">New Workspace</h1>
            <p className="mt-2 text-sm text-neutral-500 font-medium">Create a workspace to share multiple documents at once.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50/50 border border-red-100 text-red-700 rounded-xl text-sm font-medium flex items-center gap-2">
              <span className="text-red-500 text-lg">&#9888;</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input label="Workspace Name" required placeholder="Q4 Earnings Report" value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} />
            
            <div>
              <label className="block text-sm font-semibold text-neutral-800 mb-1.5">Description <span className="text-neutral-400 font-normal">(optional)</span></label>
              <textarea
                className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 shadow-sm resize-none"
                rows={4}
                placeholder="Documents for the upcoming quarterly board meeting..."
                value={form.description}
                onChange={(e: any) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button type="button" variant="ghost" className="w-full" onClick={() => navigate('/workspaces')}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
