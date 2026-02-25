import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listSessions } from '../api/sessions'
import { useAuth } from '../hooks/useAuth'
import SessionCard from '../components/sessions/SessionCard'
import JoinModal from '../components/sessions/JoinModal'

export default function Sessions() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showJoin, setShowJoin] = useState(false)

  useEffect(() => {
    listSessions()
      .then(data => setSessions(data.sessions))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const activeSessions = sessions.filter(s => s.status !== 'ended')
  const pastSessions = sessions.filter(s => s.status === 'ended')
  const isFree = user?.plan === 'free'

  return (
    <div className="min-h-screen bg-neutral-50 px-4 sm:px-6 lg:px-8 pt-24 pb-10">
      <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Sessions</h1>
          <p className="text-sm text-neutral-500 mt-1">Collaborate on documents in real-time</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowJoin(true)}
            className="px-4 py-2.5 rounded-lg border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Join Session
          </button>
          {isFree ? (
            <Link
              to="/billing"
              className="px-4 py-2.5 rounded-lg bg-neutral-200 text-sm font-medium text-neutral-500 cursor-not-allowed"
              title="Upgrade to create sessions"
            >
              Upgrade to Create
            </Link>
          ) : (
            <Link
              to="/sessions/new"
              className="px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 shadow-md shadow-brand-600/20 transition-colors"
            >
              New Session
            </Link>
          )}
        </div>
      </div>

      {isFree && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Collaborative Sessions</span> are available on Pro and Business plans.
            You can still join sessions created by others.
            <Link to="/billing" className="ml-1 font-semibold underline hover:text-amber-900">Upgrade now</Link>
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-brand-600" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <p className="text-neutral-600 font-medium">No sessions yet</p>
          <p className="text-sm text-neutral-400 mt-1">Create a session to collaborate on a document, or join one with an invite code.</p>
        </div>
      ) : (
        <>
          {activeSessions.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">Active Sessions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeSessions.map(s => <SessionCard key={s.id} session={s} />)}
              </div>
            </div>
          )}

          {pastSessions.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">Past Sessions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastSessions.map(s => <SessionCard key={s.id} session={s} />)}
              </div>
            </div>
          )}
        </>
      )}

      {showJoin && <JoinModal onClose={() => setShowJoin(false)} />}
      </div>
    </div>
  )
}
