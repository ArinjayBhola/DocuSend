import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import usePdfRenderer from '../hooks/usePdfRenderer'
import {
  getSession, startSession, endSession, leaveSession,
  updatePresence, createAnnotation, sendMessage, sendTyping
} from '../api/sessions'
import AnnotationToolbar from '../components/sessions/AnnotationToolbar'
import AnnotationLayer from '../components/sessions/AnnotationLayer'
import ParticipantList from '../components/sessions/ParticipantList'
import CursorOverlay from '../components/sessions/CursorOverlay'
import ChatPanel from '../components/sessions/ChatPanel'

export default function SessionRoom() {
  const { id } = useParams()
  const sessionId = parseInt(id!)
  const navigate = useNavigate()
  const { user } = useAuth()

  const [session, setSession] = useState<any>(null)
  const [myRole, setMyRole] = useState<string>('member')
  const [participants, setParticipants] = useState<any[]>([])
  const [annotations, setAnnotations] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [typingUsers, setTypingUsers] = useState<any[]>([])
  const [remoteCursors, setRemoteCursors] = useState<any[]>([])
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Annotation tool state
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [activeColor, setActiveColor] = useState('#3B82F6')
  const [strokeWidth, setStrokeWidth] = useState(2)

  const eventSourceRef = useRef<EventSource | null>(null)
  const presenceThrottleRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Load session detail
  useEffect(() => {
    getSession(sessionId)
      .then(data => {
        setSession(data.session)
        setMyRole(data.myRole)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message || 'Failed to load session')
        setLoading(false)
      })
  }, [sessionId])

  // PDF renderer
  const pdfUrl = session ? `/api/share/pdf/${session.shareSlug}` : ''
  const { loading: pdfLoading, error: pdfError, numPages, currentPage, currentPageRef, containerRef, pageRefsMap } = usePdfRenderer(pdfUrl)

  // SSE connection
  useEffect(() => {
    if (!session) return

    const es = new EventSource(`/api/sessions/${sessionId}/stream`, { withCredentials: true })
    eventSourceRef.current = es

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        switch (data.type) {
          case 'init':
            setParticipants(data.participants || [])
            setAnnotations(data.annotations || [])
            setMessages(data.messages || [])
            setConnected(true)
            break

          case 'participant_joined':
            setParticipants(prev => {
              if (prev.find(p => p.userId === data.userId)) return prev
              return [...prev, { userId: data.userId, name: data.name, color: data.color, currentPage: data.currentPage || 1 }]
            })
            break

          case 'participant_left':
            setParticipants(prev => prev.filter(p => p.userId !== data.userId))
            setRemoteCursors(prev => prev.filter(c => c.userId !== data.userId))
            break

          case 'presence_update':
            setParticipants(prev => prev.map(p =>
              p.userId === data.userId ? { ...p, currentPage: data.currentPage } : p
            ))
            setRemoteCursors(prev => {
              const existing = prev.filter(c => c.userId !== data.userId)
              return [...existing, {
                userId: data.userId,
                name: data.name,
                color: participants.find(p => p.userId === data.userId)?.color || '#3B82F6',
                cursorX: data.cursorX,
                cursorY: data.cursorY,
                currentPage: data.currentPage,
              }]
            })
            break

          case 'annotation_created':
            setAnnotations(prev => [...prev, data.annotation])
            break

          case 'annotation_updated':
            setAnnotations(prev => prev.map(a => a.id === data.annotation.id ? data.annotation : a))
            break

          case 'annotation_deleted':
            setAnnotations(prev => prev.filter(a => a.id !== data.annotationId))
            break

          case 'message_created':
            setMessages(prev => [...prev, data.message])
            break

          case 'typing_start':
            setTypingUsers(prev => {
              if (prev.find(u => u.userId === data.userId)) return prev
              return [...prev, { userId: data.userId, name: data.name }]
            })
            break

          case 'typing_stop':
            setTypingUsers(prev => prev.filter(u => u.userId !== data.userId))
            break

          case 'session_started':
            setSession(prev => prev ? { ...prev, status: 'active' } : prev)
            break

          case 'session_ended':
            setSession(prev => prev ? { ...prev, status: 'ended' } : prev)
            break
        }
      } catch { /* ignore parse errors */ }
    }

    es.onerror = () => {
      setConnected(false)
    }

    return () => {
      es.close()
      eventSourceRef.current = null
    }
  }, [session?.id])

  // Send presence updates on page change
  useEffect(() => {
    if (!connected || !session) return
    updatePresence(sessionId, { currentPage }).catch(() => {})
  }, [currentPage, connected, sessionId])

  // Track cursor movement
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!connected) return
    if (presenceThrottleRef.current) return

    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const cursorX = e.clientX - rect.left + container.scrollLeft
    const cursorY = e.clientY - rect.top + container.scrollTop

    presenceThrottleRef.current = setTimeout(() => {
      presenceThrottleRef.current = undefined
    }, 50)

    updatePresence(sessionId, { currentPage: currentPageRef.current, cursorX, cursorY }).catch(() => {})
  }, [connected, sessionId])

  const handleAnnotationCreate = useCallback(async (annotation: any) => {
    try {
      await createAnnotation(sessionId, annotation)
    } catch (err) {
      console.error('Failed to create annotation:', err)
    }
  }, [sessionId])

  const handleSendMessage = useCallback(async (content: string) => {
    try {
      await sendMessage(sessionId, { content })
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }, [sessionId])

  const handleTyping = useCallback((isTyping: boolean) => {
    sendTyping(sessionId, isTyping).catch(() => {})
  }, [sessionId])

  const handleStart = async () => {
    try {
      await startSession(sessionId)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleEnd = async () => {
    if (!confirm('End this session for all participants?')) return
    try {
      await endSession(sessionId)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleLeave = async () => {
    try {
      await leaveSession(sessionId)
      navigate('/sessions')
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-brand-600" />
      </div>
    )
  }

  if (error && !session) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <p className="text-red-600 font-medium mb-4">{error}</p>
        <button onClick={() => navigate('/sessions')} className="text-sm text-brand-600 hover:underline">Back to Sessions</button>
      </div>
    )
  }

  // Waiting room
  if (session?.status === 'waiting') {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-1">{session.title}</h2>
          <p className="text-sm text-neutral-500 mb-6">Waiting for the host to start the session</p>

          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-6">
            <p className="text-xs text-neutral-500 mb-1">Invite Code</p>
            <p className="text-2xl font-mono font-bold tracking-widest text-neutral-900">{session.code}</p>
          </div>

          <div className="mb-6">
            <p className="text-xs text-neutral-500 mb-2">Participants ({participants.length})</p>
            <div className="flex justify-center">
              <ParticipantList participants={participants} currentUserId={user!.id} />
            </div>
          </div>

          {myRole === 'host' ? (
            <button onClick={handleStart} className="w-full px-6 py-3 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 shadow-md shadow-brand-600/20 transition-colors">
              Start Session
            </button>
          ) : (
            <p className="text-sm text-neutral-400">The host will start the session shortly...</p>
          )}

          <div className="flex items-center justify-center gap-1 mt-3">
            <span className={`relative flex h-2 w-2 ${connected ? '' : 'opacity-50'}`}>
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${connected ? 'bg-emerald-400' : 'bg-neutral-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${connected ? 'bg-emerald-500' : 'bg-neutral-400'}`}></span>
            </span>
            <span className="text-xs text-neutral-400">{connected ? 'Connected' : 'Connecting...'}</span>
          </div>
        </div>
      </div>
    )
  }

  // Ended session
  if (session?.status === 'ended') {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm">
          <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-1">{session.title}</h2>
          <p className="text-sm text-neutral-500 mb-4">This session has ended</p>
          <p className="text-xs text-neutral-400 mb-6">
            {annotations.length} annotations, {messages.length} messages
          </p>
          <button onClick={() => navigate('/sessions')} className="px-6 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors">
            Back to Sessions
          </button>
        </div>
      </div>
    )
  }

  // Active session — main room
  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col pt-20">
      {/* Top bar */}
      <div className="bg-white border-b border-neutral-200 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 truncate max-w-[200px]">{session?.title}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-neutral-400 font-mono bg-neutral-100 px-1.5 py-0.5 rounded">{session?.code}</span>
              <span className="flex items-center gap-1">
                <span className={`relative flex h-1.5 w-1.5 ${connected ? '' : 'opacity-50'}`}>
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${connected ? 'bg-emerald-400' : 'bg-neutral-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${connected ? 'bg-emerald-500' : 'bg-neutral-400'}`}></span>
                </span>
              </span>
            </div>
          </div>
          <div className="h-6 w-px bg-neutral-200" />
          <ParticipantList participants={participants} currentUserId={user!.id} />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-neutral-500 bg-neutral-100 px-2 py-1 rounded">
            {pdfLoading ? 'Loading...' : `Page ${currentPage} / ${numPages}`}
          </span>
          {myRole === 'host' && (
            <button onClick={handleEnd} className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-medium hover:bg-red-200 transition-colors">
              End Session
            </button>
          )}
          <button onClick={handleLeave} className="px-3 py-1.5 rounded-lg border border-neutral-300 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-colors">
            Leave
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Annotation toolbar */}
        <AnnotationToolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          activeColor={activeColor}
          onColorChange={setActiveColor}
          strokeWidth={strokeWidth}
          onStrokeWidthChange={setStrokeWidth}
        />

        {/* PDF + annotations area */}
        <div
          className="flex-1 overflow-y-auto bg-neutral-100 pl-16"
          onPointerMove={handlePointerMove}
        >
          <div ref={containerRef} className="py-6 px-4 flex flex-col items-center gap-6 relative">
            {/* Annotation layers are rendered over each page */}
          </div>

          {/* Render annotation overlays on each page after PDF loads */}
          {!pdfLoading && !pdfError && Array.from(pageRefsMap.current.entries()).map(([pageNum, pageEl]) => {
            const rect = pageEl.getBoundingClientRect()
            return (
              <div key={pageNum} style={{
                position: 'absolute',
                left: pageEl.offsetLeft,
                top: pageEl.offsetTop,
                width: pageEl.offsetWidth,
                height: pageEl.offsetHeight,
                pointerEvents: activeTool ? 'all' : 'none',
              }}>
                <AnnotationLayer
                  pageNumber={pageNum}
                  width={pageEl.offsetWidth}
                  height={pageEl.offsetHeight}
                  annotations={annotations}
                  activeTool={activeTool}
                  activeColor={activeColor}
                  strokeWidth={strokeWidth}
                  onAnnotationCreate={handleAnnotationCreate}
                />
                <CursorOverlay
                  cursors={remoteCursors}
                  currentPage={pageNum}
                  currentUserId={user!.id}
                />
              </div>
            )
          })}

          {pdfLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-brand-600 mb-4" />
              <p className="text-sm text-neutral-400">Loading document...</p>
            </div>
          )}

          {pdfError && (
            <div className="text-center py-20">
              <p className="text-red-600 text-sm">{pdfError}</p>
            </div>
          )}
        </div>

        {/* Chat panel */}
        <ChatPanel
          messages={messages}
          currentUserId={user!.id}
          typingUsers={typingUsers.filter(u => u.userId !== user!.id)}
          onSend={handleSendMessage}
          onTyping={handleTyping}
        />
      </div>
    </div>
  )
}
