import { useState, useRef, useEffect } from 'react'

const TOOLS = [
  { id: 'pen', label: 'Pen', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
  { id: 'eraser', label: 'Eraser', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
  { id: 'highlight', label: 'Highlight', icon: 'M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13' },
  { id: 'comment', label: 'Comment', icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
  { id: 'shape', label: 'Shape', icon: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4z' },
  { id: 'text', label: 'Text', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
]

interface Props {
  activeTool: string | null
  onToolChange: (tool: string | null) => void
  activeColor: string
  onColorChange: (color: string) => void
  strokeWidth: number
  onStrokeWidthChange: (w: number) => void
}

export default function AnnotationToolbar({ activeTool, onToolChange, activeColor, onColorChange, strokeWidth, onStrokeWidthChange }: Props) {
  const PALETTE = ['#3B82F6','#EF4444','#10B981','#F59E0B','#8B5CF6','#EC4899']
  
  const [collapsed, setCollapsed] = useState(false)
  const [pos, setPos] = useState({ x: 20, y: 150 })
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{ startX: number; startY: number; startPos: { x: number; y: number } } | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('annotation_toolbar_pos')
    if (saved) {
      try {
        setPos(JSON.parse(saved))
      } catch (e) {}
    }
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true)
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPos: { x: pos.x, y: pos.y }
    }
  }

  useEffect(() => {
    if (!dragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      const newPos = {
        x: Math.max(0, Math.min(window.innerWidth - 60, dragRef.current.startPos.x + dx)),
        y: Math.max(80, Math.min(window.innerHeight - 300, dragRef.current.startPos.y + dy))
      }
      setPos(newPos)
    }

    const handleMouseUp = () => {
      setDragging(false)
      localStorage.setItem('annotation_toolbar_pos', JSON.stringify(pos))
      dragRef.current = null
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging, pos])

  const activeToolIcon = TOOLS.find(t => t.id === activeTool)?.icon

  return (
    <div 
      className={`fixed z-40 bg-white/95 backdrop-blur-sm border border-neutral-200 rounded-xl shadow-lg flex flex-col transition-all duration-300 ${collapsed ? 'w-12 h-12' : 'p-2 gap-1'}`}
      style={{ left: pos.x, top: pos.y }}
    >
      {/* Drag Handle & Collapse Toggle */}
      <div 
        onMouseDown={handleMouseDown}
        className={`flex items-center justify-between cursor-grab active:cursor-grabbing hover:bg-neutral-50 rounded-lg group transition-all ${collapsed ? 'absolute inset-0 p-2' : 'h-6 px-1'}`}
      >
        {!collapsed && (
          <div className="flex gap-0.5">
            <div className="w-1 h-1 rounded-full bg-neutral-300" />
            <div className="w-1 h-1 rounded-full bg-neutral-300" />
            <div className="w-1 h-1 rounded-full bg-neutral-300" />
          </div>
        )}
        
        {collapsed ? (
          <div className="w-full h-full flex items-center justify-center relative">
            {activeToolIcon ? (
              <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={activeToolIcon} />
              </svg>
            ) : (
              <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); setCollapsed(false) }}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-neutral-600 shadow-sm"
            >
              <svg className="w-2.5 h-2.5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setCollapsed(true)}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="p-1 flex flex-col gap-1">
          {TOOLS.map(tool => (
            <button
              key={tool.id}
              onClick={() => onToolChange(activeTool === tool.id ? null : tool.id)}
              title={tool.label}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                activeTool === tool.id
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={tool.icon} />
              </svg>
            </button>
          ))}

          <div className="h-px bg-neutral-200 my-1" />

          {/* Color picker */}
          <div className="flex flex-col gap-1 items-center">
            {PALETTE.map(c => (
              <button
                key={c}
                onClick={() => onColorChange(c)}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                  activeColor === c ? 'border-neutral-900 scale-110' : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="h-px bg-neutral-200 my-1" />

          {/* Stroke width */}
          <div className="flex flex-col gap-1 items-center px-1">
            {[2, 4, 6].map(w => (
              <button
                key={w}
                onClick={() => onStrokeWidthChange(w)}
                className={`w-8 h-6 rounded flex items-center justify-center ${
                  strokeWidth === w ? 'bg-neutral-200' : 'hover:bg-neutral-100'
                }`}
              >
                <div className="rounded-full bg-neutral-700" style={{ width: `${w * 4}px`, height: `${w}px` }} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
