interface Participant {
  userId: number
  name: string
  color: string
  currentPage?: number
}

interface Props {
  participants: Participant[]
  currentUserId: number
}

export default function ParticipantList({ participants, currentUserId }: Props) {
  return (
    <div className="flex items-center gap-1">
      {participants.map(p => (
        <div key={p.userId} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-neutral-100/80" title={`${p.name}${p.currentPage ? ` — Page ${p.currentPage}` : ''}`}>
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ring-2 ring-white"
            style={{ backgroundColor: p.color }}
          >
            {p.name.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-medium text-neutral-700 max-w-[80px] truncate">
            {p.userId === currentUserId ? 'You' : p.name.split(' ')[0]}
          </span>
          {p.currentPage && (
            <span className="text-[10px] text-neutral-400 font-mono">p{p.currentPage}</span>
          )}
        </div>
      ))}
    </div>
  )
}
