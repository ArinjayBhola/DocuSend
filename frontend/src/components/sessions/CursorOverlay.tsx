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
}

export default function CursorOverlay({ cursors, currentPage, currentUserId }: Props) {
  const visibleCursors = cursors.filter(
    c => c.userId !== currentUserId && c.currentPage === currentPage && (c.cursorX > 0 || c.cursorY > 0)
  )

  if (visibleCursors.length === 0) return null

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {visibleCursors.map(c => (
        <div
          key={c.userId}
          className="absolute transition-all duration-100"
          style={{ left: c.cursorX, top: c.cursorY }}
        >
          {/* Cursor arrow */}
          <svg width="16" height="20" viewBox="0 0 16 20" fill="none" className="-ml-0.5">
            <path
              d="M1 1L1 15.5L5.5 11.5L9.5 19L12 18L8 10.5L14 10.5L1 1Z"
              fill={c.color}
              stroke="white"
              strokeWidth={1.5}
            />
          </svg>
          {/* Name tag */}
          <div
            className="absolute left-4 top-4 px-1.5 py-0.5 rounded text-[10px] font-medium text-white whitespace-nowrap shadow-sm"
            style={{ backgroundColor: c.color }}
          >
            {c.name.split(' ')[0]}
          </div>
        </div>
      ))}
    </div>
  )
}
