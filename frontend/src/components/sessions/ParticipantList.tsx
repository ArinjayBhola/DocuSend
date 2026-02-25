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
        <div key={p.userId} className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-100/50 hover:bg-white hover:shadow-sm border border-transparent hover:border-neutral-200 transition-all duration-200" title={`${p.name}${p.currentPage ? ` — Page ${p.currentPage}` : ''}`}>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ring-2 ring-white shadow-sm group-hover:scale-110 transition-transform"
            style={{ backgroundColor: p.color }}
          >
            {p.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-neutral-800 max-w-[80px] truncate leading-tight">
              {p.userId === currentUserId ? 'You' : p.name.split(' ')[0]}
            </span>
            {p.currentPage && (
              <span className="text-[9px] text-neutral-400 font-medium uppercase tracking-wider">Page {p.currentPage}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
