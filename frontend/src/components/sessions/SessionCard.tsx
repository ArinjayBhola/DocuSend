import { Link } from 'react-router-dom'

const statusColors = {
  waiting: 'bg-amber-100 text-amber-700 border-amber-200',
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  ended: 'bg-neutral-100 text-neutral-500 border-neutral-200',
}

export default function SessionCard({ session }: { session: any }) {
  return (
    <Link
      to={session.status === 'ended' ? `/sessions/${session.id}` : `/sessions/${session.id}`}
      className="block bg-white border border-neutral-200 rounded-xl p-5 hover:shadow-md hover:border-neutral-300 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-neutral-900 truncate pr-4">{session.title}</h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${statusColors[session.status] || statusColors.ended}`}>
          {session.status}
        </span>
      </div>

      <p className="text-sm text-neutral-500 truncate mb-3">{session.documentTitle}</p>

      <div className="flex items-center justify-between text-xs text-neutral-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {session.participantCount || 0}/{session.maxParticipants}
          </span>
          <span className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-500">{session.code}</span>
        </div>
        <span className="capitalize">{session.role}</span>
      </div>
    </Link>
  )
}
