interface Participant {
  userId: number
  name: string
  color: string
  currentPage?: number
}

interface Props {
  participants: Participant[]
  currentUserId: number
  handRaisedUsers?: Set<number>
  screenSharingUsers?: Set<number>
  speakingUsers?: Set<number>
  mutedUsers?: Set<number>
}

export default function ParticipantList({ participants, currentUserId, handRaisedUsers, screenSharingUsers, speakingUsers, mutedUsers }: Props) {
  return (
    <div className="flex items-center gap-1">
      {participants.map(p => {
        const isHandRaised = handRaisedUsers?.has(p.userId)
        const isScreenSharing = screenSharingUsers?.has(p.userId)
        const isSpeaking = speakingUsers?.has(p.userId)
        const isMuted = mutedUsers?.has(p.userId)

        return (
          <div key={p.userId} className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-100/50 hover:bg-white hover:shadow-sm border border-transparent hover:border-neutral-200 transition-all duration-200" title={`${p.name}${p.currentPage ? ` — Page ${p.currentPage}` : ''}`}>
            <div className="relative">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ring-2 shadow-sm group-hover:scale-110 transition-transform ${isSpeaking ? 'ring-emerald-400 animate-pulse' : 'ring-white'}`}
                style={{ backgroundColor: p.color }}
              >
                {p.name.charAt(0).toUpperCase()}
              </div>
              {isMuted && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 19L5 5m0 0l14 14" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold text-neutral-800 max-w-[80px] truncate leading-tight">
                  {p.userId === currentUserId ? 'You' : p.name.split(' ')[0]}
                </span>
                {isHandRaised && (
                  <span className="text-amber-500 animate-bounce" title="Hand raised">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019A1 1 0 0112 13.5V8.118l-2-.8-2 .8V13.5a1 1 0 01-.333.481A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
                    </svg>
                  </span>
                )}
                {isScreenSharing && (
                  <span className="text-blue-500" title="Sharing screen">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
                    </svg>
                  </span>
                )}
              </div>
              {p.currentPage && (
                <span className="text-[9px] text-neutral-400 font-medium uppercase tracking-wider">Page {p.currentPage}</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
