import { useRef, useState, useCallback, useEffect } from 'react'

interface Annotation {
  id: number
  userId: number
  userName: string
  pageNumber: number
  type: string
  data: any
  color: string
  resolved: boolean
}

interface Props {
  pageNumber: number
  width: number
  height: number
  annotations: Annotation[]
  activeTool: string | null
  activeColor: string
  strokeWidth: number
  onAnnotationCreate: (annotation: { pageNumber: number; type: string; data: any; color: string }) => void
  onAnnotationDelete: (annotationId: number) => void
}

export default function AnnotationLayer({
  pageNumber, width, height, annotations, activeTool, activeColor, strokeWidth, onAnnotationCreate, onAnnotationDelete
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [points, setPoints] = useState<{ x: number; y: number }[]>([])
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null)
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null)
  const [commentText, setCommentText] = useState('')
  const [commentPos, setCommentPos] = useState<{ x: number; y: number } | null>(null)
  const [textInput, setTextInput] = useState<{ x: number; y: number } | null>(null)
  const [textValue, setTextValue] = useState('')
  const [pendingAnnotations, setPendingAnnotations] = useState<any[]>([])
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  const getRelativePos = useCallback((e: React.PointerEvent) => {
    const rect = svgRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }, [])

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!activeTool) return
    const pos = getRelativePos(e)

    if (activeTool === 'comment') {
      setCommentPos(pos)
      return
    }

    if (activeTool === 'text') {
      setTextInput(pos)
      return
    }

    setDrawing(true)
    setStartPos(pos)
    setCurrentPos(pos)

    if (activeTool === 'pen') {
      setPoints([pos])
    }

    ;(e.target as Element).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drawing || !activeTool) return
    const pos = getRelativePos(e)
    setCurrentPos(pos)

    if (activeTool === 'pen') {
      setPoints(prev => [...prev, pos])
    }
  }

  const handlePointerUp = () => {
    if (!drawing || !activeTool || !startPos || !currentPos) {
      setDrawing(false)
      return
    }

    if (activeTool === 'pen' && points.length > 2) {
      const pendingId = Date.now()
      const newAnnotation = {
        id: pendingId,
        pageNumber,
        type: 'pen',
        data: { points, strokeWidth },
        color: activeColor,
        isPending: true
      }
      setPendingAnnotations(prev => [...prev, newAnnotation])
      onAnnotationCreate({
        pageNumber,
        type: 'pen',
        data: { points, strokeWidth },
        color: activeColor,
      })
    } else if (activeTool === 'highlight') {
      const x = Math.min(startPos.x, currentPos.x)
      const y = Math.min(startPos.y, currentPos.y)
      const w = Math.abs(currentPos.x - startPos.x)
      const h = Math.abs(currentPos.y - startPos.y)
      if (w > 5 && h > 5) {
        onAnnotationCreate({
          pageNumber,
          type: 'highlight',
          data: { rects: [{ x, y, width: w, height: h }] },
          color: activeColor,
        })
      }
    } else if (activeTool === 'shape') {
      const x = Math.min(startPos.x, currentPos.x)
      const y = Math.min(startPos.y, currentPos.y)
      const w = Math.abs(currentPos.x - startPos.x)
      const h = Math.abs(currentPos.y - startPos.y)
      if (w > 5 && h > 5) {
        onAnnotationCreate({
          pageNumber,
          type: 'shape',
          data: { shapeType: 'rect', x, y, width: w, height: h },
          color: activeColor,
        })
      }
    }

    setDrawing(false)
    setPoints([])
    setStartPos(null)
    setCurrentPos(null)
  }

  const handleCommentSubmit = () => {
    if (!commentPos || !commentText.trim()) return
    onAnnotationCreate({
      pageNumber,
      type: 'comment',
      data: { x: commentPos.x, y: commentPos.y, text: commentText.trim() },
      color: activeColor,
    })
    setCommentPos(null)
    setCommentText('')
  }

  const handleTextSubmit = () => {
    if (!textInput || !textValue.trim()) return
    onAnnotationCreate({
      pageNumber,
      type: 'text',
      data: { x: textInput.x, y: textInput.y, text: textValue.trim(), fontSize: 16 },
      color: activeColor,
    })
    setTextInput(null)
    setTextValue('')
  }

  // Cleanup pending annotations when they are confirmed by the server
  useEffect(() => {
    setPendingAnnotations(prev => prev.filter(p => !annotations.some(a => 
      a.pageNumber === p.pageNumber && 
      a.type === p.type && 
      a.color === p.color &&
      JSON.stringify(a.data) === JSON.stringify(p.data)
    )))
  }, [annotations])

  const pageAnnotations = [
    ...annotations.filter(a => a.pageNumber === pageNumber), 
    ...pendingAnnotations.filter(p => p.pageNumber === pageNumber)
  ]

  return (
    <div className="absolute inset-0" style={{ pointerEvents: activeTool ? 'all' : 'none' }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="absolute inset-0"
        style={{ 
          cursor: activeTool === 'pen' 
            ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z'%3E%3C/path%3E%3C/svg%3E") 0 24, auto`
            : activeTool === 'eraser'
            ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 20H7L3 16C2 15 2 13 3 12L13 2L22 11L20 20Z'%3E%3C/path%3E%3Cpath d='M17 17L7 7'%3E%3C/path%3E%3C/svg%3E") 0 24, auto`
            : activeTool ? 'crosshair' : 'default',
          touchAction: 'none'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Render existing annotations */}
        {pageAnnotations.map(a => {
          const isEraser = activeTool === 'eraser';
          const commonProps = {
            onPointerDown: (e: React.PointerEvent) => {
              if (isEraser) {
                e.stopPropagation();
                onAnnotationDelete(a.id);
              }
            },
            className: `cursor-pointer transition-all duration-200 ${isEraser ? 'hover:opacity-40 group' : ''}`,
            style: isEraser ? { filter: 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.4))' } : {}
          };

          if (a.type === 'highlight') {
            return (
              <g key={a.id} {...commonProps}>
                {a.data.rects?.map((r: any, i: number) => (
                  <rect key={`${a.id}-${i}`} x={r.x} y={r.y} width={r.width} height={r.height}
                    fill={a.color} fillOpacity={0.25} stroke={isEraser ? '#EF4444' : a.color} strokeWidth={isEraser ? 1.5 : 1} strokeOpacity={isEraser ? 0.8 : 0.5} />
                ))}
              </g>
            )
          }
          if (a.type === 'pen') {
            const pts = a.data.points?.map((p: any) => `${p.x},${p.y}`).join(' ')
            return (
              <g key={a.id} {...commonProps}>
                {/* Wider invisible stroke for easier hit detection */}
                <polyline points={pts} fill="none" stroke="rgba(0,0,0,0)"
                  strokeWidth={Math.max(a.data.strokeWidth || 2, 20)} strokeLinecap="round" strokeLinejoin="round" 
                  pointerEvents="stroke" />
                <polyline points={pts} fill="none" stroke={a.color}
                  strokeWidth={a.data.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" 
                  className={`${isEraser ? 'group-hover:stroke-red-500' : ''} ${a.isPending ? 'opacity-70' : ''}`}
                />
              </g>
            )
          }
          if (a.type === 'shape') {
            const d = a.data
            let shape = null
            if (d.shapeType === 'rect') {
              shape = <rect x={d.x} y={d.y} width={d.width} height={d.height}
                fill="none" stroke={isEraser ? '#EF4444' : a.color} strokeWidth={isEraser ? 3 : 2} />
            } else if (d.shapeType === 'ellipse') {
              shape = <ellipse cx={d.x + d.width / 2} cy={d.y + d.height / 2}
                rx={d.width / 2} ry={d.height / 2} fill="none" stroke={isEraser ? '#EF4444' : a.color} strokeWidth={isEraser ? 3 : 2} />
            } else if (d.shapeType === 'arrow') {
              shape = <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2}
                stroke={isEraser ? '#EF4444' : a.color} strokeWidth={isEraser ? 3 : 2} markerEnd={isEraser ? "" : "url(#arrowhead)"} />
            }
            return <g key={a.id} {...commonProps}>{shape}</g>
          }
          if (a.type === 'comment') {
            return (
              <g key={a.id} {...commonProps}>
                <circle cx={a.data.x} cy={a.data.y} r={12} fill={isEraser ? '#EF4444' : a.color} fillOpacity={0.9} className="animate-in fade-in zoom-in duration-300" />
                <text x={a.data.x} y={a.data.y + 4} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold" style={{ pointerEvents: 'none' }} className="animate-in fade-in zoom-in duration-300 delay-100">
                  {isEraser ? '×' : '?'}
                </text>
                <title>{a.data.text} — {a.userName}</title>
              </g>
            )
          }
          if (a.type === 'text') {
            return (
              <foreignObject key={a.id} x={a.data.x} y={a.data.y} width={250} height={100} {...commonProps} className={`animate-in slide-in-from-top-1 duration-300 ${commonProps.className}`}>
                <div style={{ color: isEraser ? '#EF4444' : a.color, fontSize: a.data.fontSize || 16, fontWeight: 500, lineHeight: 1.2, textDecoration: isEraser ? 'line-through' : 'none' }}>
                  {a.data.text}
                </div>
              </foreignObject>
            )
          }
          return null
        })}

        {/* Drawing preview */}
        {drawing && activeTool === 'pen' && points.length > 1 && (
          <polyline
            points={points.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none" stroke={activeColor} strokeWidth={strokeWidth}
            strokeLinecap="round" strokeLinejoin="round" opacity={0.7}
          />
        )}
        {drawing && activeTool === 'highlight' && startPos && currentPos && (
          <rect
            x={Math.min(startPos.x, currentPos.x)}
            y={Math.min(startPos.y, currentPos.y)}
            width={Math.abs(currentPos.x - startPos.x)}
            height={Math.abs(currentPos.y - startPos.y)}
            fill={activeColor} fillOpacity={0.2} stroke={activeColor} strokeWidth={1} strokeDasharray="4"
          />
        )}
        {drawing && activeTool === 'shape' && startPos && currentPos && (
          <rect
            x={Math.min(startPos.x, currentPos.x)}
            y={Math.min(startPos.y, currentPos.y)}
            width={Math.abs(currentPos.x - startPos.x)}
            height={Math.abs(currentPos.y - startPos.y)}
            fill="none" stroke={activeColor} strokeWidth={2} strokeDasharray="4"
          />
        )}

        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
          </marker>
        </defs>
      </svg>

      {/* Comment input popup */}
      {commentPos && (
        <div
          className="absolute bg-white/95 backdrop-blur border border-neutral-200 rounded-xl shadow-xl p-3 z-50 animate-in zoom-in-95 duration-200"
          style={{ left: Math.min(commentPos.x, width - 220), top: Math.min(commentPos.y + 16, height - 120), minWidth: 200 }}
          onClick={e => e.stopPropagation()}
        >
          <textarea
            autoFocus
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="w-full text-sm border border-neutral-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            rows={2}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => { setCommentPos(null); setCommentText('') }}
              className="px-2 py-1 text-xs font-medium text-neutral-500 hover:text-neutral-700 transition-colors">Cancel</button>
            <button onClick={handleCommentSubmit}
              className="px-3 py-1 text-xs font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-sm transition-colors">Add Comment</button>
          </div>
        </div>
      )}

      {/* Text input popup */}
      {textInput && (
        <div
          className="absolute bg-white border border-neutral-300 rounded-lg shadow-lg p-3 z-50"
          style={{ left: textInput.x, top: textInput.y + 16, minWidth: 200 }}
          onClick={e => e.stopPropagation()}
        >
          <input
            autoFocus
            value={textValue}
            onChange={e => setTextValue(e.target.value)}
            placeholder="Enter text..."
            className="w-full text-sm border border-neutral-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
            onKeyDown={e => e.key === 'Enter' && handleTextSubmit()}
          />
          <div className="flex gap-2 mt-2">
            <button onClick={() => { setTextInput(null); setTextValue('') }}
              className="text-xs text-neutral-500 hover:text-neutral-700">Cancel</button>
            <button onClick={handleTextSubmit}
              className="text-xs bg-brand-600 text-white px-3 py-1 rounded hover:bg-brand-700">Add</button>
          </div>
        </div>
      )}
    </div>
  )
}
