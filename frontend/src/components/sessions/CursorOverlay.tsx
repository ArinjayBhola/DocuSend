interface RemoteCursor {
  userId: number
  name: string
  color: string
  cursorX: number
  cursorY: number
  currentPage: number
}

interface Props {
  cursors: RemoteCursor[]
  currentPage: number
  currentUserId: number
  width: number
  height: number
}

export default function CursorOverlay({ cursors, currentPage, currentUserId, width, height }: Props) {
  const visibleCursors = cursors.filter(
    c => c.userId !== currentUserId && c.currentPage === currentPage && (c.cursorX > 0 || c.cursorY > 0)
  )

  if (visibleCursors.length === 0) return null

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {visibleCursors.map(c => (
        <div
          key={c.userId}
          className="absolute transition-all duration-300 ease-out"
          style={{ 
            left: c.cursorX * width, 
            top: c.cursorY * height, 
            transitionProperty: 'left, top' 
          }}
        >
          {/* Cursor arrow */}
          <svg width="18" height="22" viewBox="0 0 16 20" fill="none" className="-ml-1 select-none drop-shadow-sm">
            <path
              d="M1 1L1 15.5L5.5 11.5L9.5 19L12 18L8 10.5L14 10.5L1 1Z"
              fill={c.color}
              stroke="white"
              strokeWidth={2}
            />
          </svg>
          {/* Name tag */}
          <div
            className="absolute left-4 top-4 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white whitespace-nowrap shadow-lg border border-white/20 backdrop-blur-sm animate-in fade-in zoom-in duration-300"
            style={{ backgroundColor: c.color }}
          >
            {c.name.split(' ')[0]}
          </div>
        </div>
      ))}
    </div>
  )
}
