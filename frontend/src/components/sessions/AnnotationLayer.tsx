import { useRef, useState, useCallback } from 'react'

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
}

export default function AnnotationLayer({
  pageNumber, width, height, annotations, activeTool, activeColor, strokeWidth, onAnnotationCreate
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

    if (activeTool === 'freehand') {
      setPoints([pos])
    }

    ;(e.target as Element).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drawing || !activeTool) return
    const pos = getRelativePos(e)
    setCurrentPos(pos)

    if (activeTool === 'freehand') {
      setPoints(prev => [...prev, pos])
    }
  }

  const handlePointerUp = () => {
    if (!drawing || !activeTool || !startPos || !currentPos) {
      setDrawing(false)
      return
    }

    if (activeTool === 'freehand' && points.length > 2) {
      onAnnotationCreate({
        pageNumber,
        type: 'freehand',
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

  const pageAnnotations = annotations.filter(a => a.pageNumber === pageNumber)

  return (
    <div className="absolute inset-0" style={{ pointerEvents: activeTool ? 'all' : 'none' }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="absolute inset-0"
        style={{ cursor: activeTool ? 'crosshair' : 'default' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Render existing annotations */}
        {pageAnnotations.map(a => {
          if (a.type === 'highlight') {
            return a.data.rects?.map((r: any, i: number) => (
              <rect key={`${a.id}-${i}`} x={r.x} y={r.y} width={r.width} height={r.height}
                fill={a.color} fillOpacity={0.25} stroke={a.color} strokeWidth={1} strokeOpacity={0.5} />
            ))
          }
          if (a.type === 'freehand') {
            const pts = a.data.points?.map((p: any) => `${p.x},${p.y}`).join(' ')
            return <polyline key={a.id} points={pts} fill="none" stroke={a.color}
              strokeWidth={a.data.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" />
          }
          if (a.type === 'shape') {
            const d = a.data
            if (d.shapeType === 'rect') {
              return <rect key={a.id} x={d.x} y={d.y} width={d.width} height={d.height}
                fill="none" stroke={a.color} strokeWidth={2} />
            }
            if (d.shapeType === 'ellipse') {
              return <ellipse key={a.id} cx={d.x + d.width / 2} cy={d.y + d.height / 2}
                rx={d.width / 2} ry={d.height / 2} fill="none" stroke={a.color} strokeWidth={2} />
            }
            if (d.shapeType === 'arrow') {
              return <line key={a.id} x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2}
                stroke={a.color} strokeWidth={2} markerEnd="url(#arrowhead)" />
            }
            return null
          }
          if (a.type === 'comment') {
            return (
              <g key={a.id}>
                <circle cx={a.data.x} cy={a.data.y} r={12} fill={a.color} fillOpacity={0.9} />
                <text x={a.data.x} y={a.data.y + 4} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold" style={{ pointerEvents: 'none' }}>
                  ?
                </text>
                <title>{a.data.text} — {a.userName}</title>
              </g>
            )
          }
          if (a.type === 'text') {
            return (
              <foreignObject key={a.id} x={a.data.x} y={a.data.y} width={200} height={50}>
                <div style={{ color: a.color, fontSize: a.data.fontSize || 16, fontWeight: 500 }}>
                  {a.data.text}
                </div>
              </foreignObject>
            )
          }
          return null
        })}

        {/* Drawing preview */}
        {drawing && activeTool === 'freehand' && points.length > 1 && (
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
          className="absolute bg-white border border-neutral-300 rounded-lg shadow-lg p-3 z-50"
          style={{ left: commentPos.x, top: commentPos.y + 16, minWidth: 200 }}
          onClick={e => e.stopPropagation()}
        >
          <textarea
            autoFocus
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="w-full text-sm border border-neutral-200 rounded p-2 resize-none focus:outline-none focus:ring-1 focus:ring-brand-500"
            rows={2}
          />
          <div className="flex gap-2 mt-2">
            <button onClick={() => { setCommentPos(null); setCommentText('') }}
              className="text-xs text-neutral-500 hover:text-neutral-700">Cancel</button>
            <button onClick={handleCommentSubmit}
              className="text-xs bg-brand-600 text-white px-3 py-1 rounded hover:bg-brand-700">Add</button>
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
