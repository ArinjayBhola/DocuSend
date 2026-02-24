import { useState } from 'react'
import { joinSession } from '../../api/sessions'
import { useNavigate } from 'react-router-dom'

export default function JoinModal({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setError('')
    try {
      const { session } = await joinSession(code.trim())
      navigate(`/sessions/${session.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to join session')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-neutral-900 mb-1">Join Session</h2>
        <p className="text-sm text-neutral-500 mb-5">Enter the invite code shared by the session host.</p>

        <form onSubmit={handleJoin}>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Enter invite code"
            className="w-full px-4 py-3 rounded-lg border border-neutral-300 text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 mb-4"
            maxLength={8}
            autoFocus
          />

          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-neutral-300 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading || !code.trim()} className="flex-1 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors">
              {loading ? 'Joining...' : 'Join'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
