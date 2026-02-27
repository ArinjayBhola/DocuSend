import { useEffect, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import useFileRenderer from '../hooks/useFileRenderer'
import MediaStreamView from '../components/sessions/MediaStreamView'
import useVoiceChat from '../hooks/useVoiceChat'
import {
  getSession, startSession, endSession, leaveSession,
  updatePresence, createAnnotation, deleteAnnotation, sendMessage, sendTyping,
  toggleHandRaise, toggleScreenShare
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
  const [copied, setCopied] = useState(false)
  const [chatCollapsed, setChatCollapsed] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const chatCollapsedRef = useRef(false)
  const [handRaisedUsers, setHandRaisedUsers] = useState<Set<number>>(new Set())
  const [screenSharingUsers, setScreenSharingUsers] = useState<Set<number>>(new Set())

  // Keep ref in sync for SSE closure
  useEffect(() => { chatCollapsedRef.current = chatCollapsed }, [chatCollapsed])

  // Annotation tool state
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [activeColor, setActiveColor] = useState('#3B82F6')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [scale, setScale] = useState(1.0)
  const [pdfReady, setPdfReady] = useState(0) // increments to force overlay re-render after PDF load

  const eventSourceRef = useRef<EventSource | null>(null)
  const presenceThrottleRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const participantsRef = useRef<any[]>([])

  // Keep ref in sync for use in SSE closure
  useEffect(() => { participantsRef.current = participants }, [participants])

  // Voice chat signal handler ref — set by useVoiceChat callback
  const voiceSignalHandlerRef = useRef<((data: any) => void) | null>(null)

  // Voice chat
  const { 
    isActive: voiceActive, 
    isMuted: voiceMuted, 
    isScreenSharing,
    toggleMute, 
    startVoice, 
    stopVoice, 
    startScreenShare,
    stopScreenShare,
    speakingUsers, 
    peerStates,
    remoteStreams,
    joinMesh
  } = useVoiceChat(
    sessionId,
    user?.id || 0,
    participants,
    (handler) => { voiceSignalHandlerRef.current = handler }
  )

  // Auto-join RTC mesh if someone starts sharing screen
  useEffect(() => {
    if (screenSharingUsers.size > 0 && !voiceActive) {
      joinMesh()
    }
  }, [screenSharingUsers.size, voiceActive, joinMesh])

  // Hand raise audio chime
  const playHandRaiseSound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime) // A5
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5) // A4

      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5)

      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)

      oscillator.start()
      oscillator.stop(audioCtx.currentTime + 0.5)
    } catch (e) {
      console.warn('Audio context failed to start', e)
    }
  }, [])

  // Track which users are muted (for UI display) — only local user for now
  const mutedUsers = voiceMuted ? new Set([user!.id]) : new Set<number>()

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

  // File renderer — supports both PDF and images
  const fileUrl = session ? `/api/share/pdf/${session.shareSlug}` : ''
  const fileType = session?.fileType || 'pdf'
  const { loading: pdfLoading, error: pdfError, numPages, currentPage, currentPageRef, containerRef, pageRefsMap } = useFileRenderer(fileUrl, fileType, scale)

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
                color: participantsRef.current.find(p => p.userId === data.userId)?.color || '#3B82F6',
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
            if (chatCollapsedRef.current && data.message.userId !== user!.id) {
              setUnreadCount(prev => prev + 1)
            }
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
            // Session has been deleted — navigate away
            navigate('/sessions')
            break

          case 'hand_raise':
            setHandRaisedUsers(prev => {
              const next = new Set(prev)
              if (data.raised) next.add(data.userId)
              else next.delete(data.userId)
              return next
            })
            break

          case 'screen_share':
            setScreenSharingUsers(prev => {
              const next = new Set(prev)
              if (data.sharing) next.add(data.userId)
              else next.delete(data.userId)
              return next
            })
            break

          case 'signal':
            voiceSignalHandlerRef.current?.(data)
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

  // Re-render overlays when PDF finishes loading (e.g. after zoom)
  useEffect(() => {
    if (!pdfLoading && numPages > 0) {
      // Small delay to ensure DOM has updated page wrapper dimensions
      const t = setTimeout(() => setPdfReady(n => n + 1), 100)
      return () => clearTimeout(t)
    }
  }, [pdfLoading, numPages, scale])

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

    // Find which page we are over
    const pages = Array.from(pageRefsMap.current.entries())
    let activePage = currentPageRef.current
    let relativeX = 0
    let relativeY = 0
    let activeRect: DOMRect | null = null

    for (const [pageNum, pageEl] of pages) {
      const rect = pageEl.getBoundingClientRect()
      if (e.clientX >= rect.left && e.clientX <= rect.right &&
          e.clientY >= rect.top && e.clientY <= rect.bottom) {
        activePage = pageNum
        relativeX = e.clientX - rect.left
        relativeY = e.clientY - rect.top
        activeRect = rect
        break
      }
    }

    presenceThrottleRef.current = setTimeout(() => {
      presenceThrottleRef.current = undefined
    }, 200)

    if (activeRect) {
      updatePresence(sessionId, {
        currentPage: activePage,
        cursorX: relativeX / activeRect.width,
        cursorY: relativeY / activeRect.height
      }).catch(() => {})
    }
  }, [connected, sessionId])

  const handleCopyCode = useCallback(() => {
    if (!session?.code) return
    navigator.clipboard.writeText(session.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [session?.code])

  const handleAnnotationCreate = useCallback(async (annotation: any) => {
    try {
      await createAnnotation(sessionId, annotation)
    } catch (err) {
      console.error('Failed to create annotation:', err)
    }
  }, [sessionId])

  const handleAnnotationDelete = useCallback(async (annotationId: number) => {
    // Optimistic update
    setAnnotations(prev => prev.filter(a => a.id !== annotationId))
    try {
      await deleteAnnotation(sessionId, annotationId)
    } catch (err) {
      console.error('Failed to delete annotation:', err)
      // Rollback is handled by SSE re-sync or refresh if needed
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

  const handleHandRaise = useCallback(async () => {
    try {
      const { raised } = await toggleHandRaise(sessionId)
      if (raised) {
        playHandRaiseSound()
      }
    } catch (err) {
      console.error('Hand raise toggle failed', err)
    }
  }, [sessionId, playHandRaiseSound])

  const handleScreenShare = useCallback(async () => {
    try {
      if (!isScreenSharing) {
        await startScreenShare()
        await toggleScreenShare(sessionId)
      } else {
        stopScreenShare()
        await toggleScreenShare(sessionId)
      }
    } catch (err) {
      console.error('Screen share toggle failed', err)
    }
  }, [sessionId, isScreenSharing, startScreenShare, stopScreenShare])

  const handleStart = async () => {
    try {
      await startSession(sessionId)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleEnd = async () => {
    if (!confirm('End this session for all participants? All data will be permanently deleted.')) return
    try {
      await endSession(sessionId)
      navigate('/sessions')
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
    <div className="fixed inset-0 z-0 flex flex-col bg-white">
      {/* Top bar */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-neutral-200 px-6 py-3 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/sessions')} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-colors" title="Back to Sessions">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div className="flex flex-col">
            <h2 className="text-sm font-bold text-neutral-900 truncate max-w-[250px] leading-tight">{session?.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <button 
                onClick={handleCopyCode}
                className="group flex items-center gap-1.5 text-[10px] text-neutral-500 font-mono bg-neutral-100 hover:bg-neutral-200 px-1.5 py-0.5 rounded-md border border-neutral-200/50 transition-colors"
                title="Click to copy invite code"
              >
                <span>{session?.code}</span>
                {copied ? (
                  <svg className="w-2.5 h-2.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  <svg className="w-2.5 h-2.5 text-neutral-400 group-hover:text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                  </svg>
                )}
              </button>
              <span className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-100">
                <span className={`relative flex h-1.5 w-1.5 ${connected ? '' : 'opacity-50'}`}>
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${connected ? 'bg-emerald-400' : 'bg-neutral-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${connected ? 'bg-emerald-500' : 'bg-neutral-400'}`}></span>
                </span>
                <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-tighter">{connected ? 'Live' : 'Offline'}</span>
              </span>
            </div>
          </div>
          <div className="h-8 w-px bg-neutral-200 mx-2" />
          <ParticipantList participants={participants} currentUserId={user!.id} handRaisedUsers={handRaisedUsers} screenSharingUsers={screenSharingUsers} speakingUsers={speakingUsers} mutedUsers={mutedUsers} />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 shadow-sm">
            <button 
              onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
              className="w-5 h-5 flex items-center justify-center text-neutral-500 hover:text-brand-600 hover:bg-white rounded transition-all active:scale-90"
              title="Zoom Out"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
              </svg>
            </button>
            <div className="h-4 w-px bg-neutral-200 mx-1" />
            <span className="text-[10px] font-bold text-neutral-600 min-w-[70px] text-center">
              {pdfLoading ? '...' : `${currentPage} / ${numPages} (${Math.round(scale * 100)}%)`}
            </span>
            <div className="h-4 w-px bg-neutral-200 mx-1" />
            <button 
              onClick={() => setScale(s => Math.min(3, s + 0.25))}
              className="w-5 h-5 flex items-center justify-center text-neutral-500 hover:text-brand-600 hover:bg-white rounded transition-all active:scale-90"
              title="Zoom In"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-1 bg-neutral-50 border border-neutral-200 rounded-lg px-1.5 py-1 shadow-sm">
            <button
              onClick={handleHandRaise}
              className={`w-8 h-8 flex items-center justify-center rounded-md transition-all active:scale-90 ${handRaisedUsers.has(user!.id) ? 'bg-amber-100 text-amber-600' : 'text-neutral-500 hover:text-amber-600 hover:bg-amber-50'}`}
              title={handRaisedUsers.has(user!.id) ? 'Lower hand' : 'Raise hand'}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.05 4.575a1.575 1.575 0 10-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 013.15 0v1.5m-3.15 0l.075 5.925m3.075-5.925v3m0-3a1.575 1.575 0 013.15 0v3m0 0v.375c0 1.036.16 2.064.468 3.043M7.05 7.575v.375a13.342 13.342 0 001.903 6.9m2.172-10.275a1.575 1.575 0 00-3.15 0v7.5c0 .712.058 1.412.17 2.1m4.905-9.6V4.575a1.575 1.575 0 00-3.15 0v3m3.15 0v3.375c0 .831.068 1.65.2 2.453" />
              </svg>
            </button>
            <button
              onClick={handleScreenShare}
              className={`w-8 h-8 flex items-center justify-center rounded-md transition-all active:scale-90 ${screenSharingUsers.has(user!.id) ? 'bg-blue-100 text-blue-600' : 'text-neutral-500 hover:text-blue-600 hover:bg-blue-50'}`}
              title={screenSharingUsers.has(user!.id) ? 'Stop sharing indicator' : 'Share screen indicator'}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
              </svg>
            </button>
          </div>
          {myRole === 'host' && (
            <button onClick={handleEnd} className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 shadow-md shadow-red-600/10 transition-all active:scale-95">
              End Session
            </button>
          )}
          <button onClick={handleLeave} className="px-4 py-2 rounded-lg border border-neutral-300 bg-white text-xs font-bold text-neutral-600 hover:bg-neutral-50 hover:border-neutral-400 transition-all active:scale-95 shadow-sm">
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
          className="flex-1 overflow-y-auto bg-neutral-100/50 backdrop-blur-sm pl-16 selection:bg-brand-100 relative"
          onPointerMove={handlePointerMove}
        >
          <div ref={containerRef} className="py-12 px-8 flex flex-col items-center gap-10 relative z-0">
            {/* Pages are rendered here by usePdfRenderer */}
          </div>

          {/* Remote Screen Share Overlay */}
          {Array.from(remoteStreams.entries()).map(([uId, stream]) => {
            const sharer = participants.find(p => p.userId === uId)
            if (!screenSharingUsers.has(uId) || !sharer) return null
            return (
              <div key={uId} className="fixed inset-0 z-[100] p-4 bg-neutral-900/95 backdrop-blur-md flex flex-col animate-in fade-in duration-300">
                <div className="flex-1 min-h-0 w-full max-w-7xl mx-auto flex items-center justify-center">
                  <MediaStreamView stream={stream} userName={sharer.name} />
                </div>
                {/* Visual indicator that someone is sharing */}
                <div className="shrink-0 py-4 text-center">
                  <p className="text-neutral-400 text-sm font-medium">
                    You are viewing <span className="text-white font-bold">{sharer.name}</span>'s screen
                  </p>
                </div>
              </div>
            )
          })}

          {/* Local Screen Share Mini Indicator */}
          {isScreenSharing && (
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[101] px-4 py-2 bg-brand-600 text-white rounded-full shadow-2xl flex items-center gap-3 border border-white/20 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest">Sharing Screen</span>
              </div>
              <button 
                onClick={handleScreenShare}
                className="px-3 py-1 bg-white/10 hover:bg-white/25 rounded-full text-[9px] font-black uppercase transition-all active:scale-95 border border-white/5"
              >
                Stop
              </button>
            </div>
          )}

          {/* Render annotation overlays via portals into each page wrapper.
              This ensures they scroll with the PDF pages and are positioned correctly.
              pdfReady forces re-render after zoom so dimensions are correct. */}
          {!pdfLoading && !pdfError && pdfReady > 0 && Array.from(pageRefsMap.current.entries()).map(([pageNum, pageEl]) =>
            createPortal(
              <div key={`overlay-${pageNum}-${pdfReady}`} style={{
                position: 'absolute',
                inset: 0,
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
                  onAnnotationDelete={handleAnnotationDelete}
                />
                <CursorOverlay
                  cursors={remoteCursors}
                  currentPage={pageNum}
                  currentUserId={user!.id}
                  width={pageEl.offsetWidth}
                  height={pageEl.offsetHeight}
                />
              </div>,
              pageEl
            )
          )}

          {pdfLoading && (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-brand-600 mb-6" />
              <p className="text-sm font-medium text-neutral-400 animate-pulse">Initializing document workspace...</p>
            </div>
          )}

          {pdfError && (
            <div className="max-w-md mx-auto text-center py-32 bg-white rounded-2xl border border-neutral-200 shadow-sm mt-10">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-red-600 font-medium mb-2">Document Load Failed</p>
              <p className="text-sm text-neutral-500">{pdfError}</p>
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
          collapsed={chatCollapsed}
          onToggle={() => {
            setChatCollapsed(prev => !prev)
            if (chatCollapsed) setUnreadCount(0)
          }}
          unreadCount={unreadCount}
        />
      </div>

      {/* Voice chat control bar */}
      <div className="bg-white/95 backdrop-blur-sm border-t border-neutral-200 px-6 py-2 flex items-center justify-center gap-3 shrink-0 shadow-sm">
        {voiceActive ? (
          <>
            <button
              onClick={toggleMute}
              className={`w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90 ${voiceMuted ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`}
              title={voiceMuted ? 'Unmute' : 'Mute'}
            >
              {voiceMuted ? (
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 19L5 5m7-2a3 3 0 00-3 3v4a3 3 0 005.12 2.12M15 9.34V6a3 3 0 00-5.94-.6M17 14a5 5 0 01-7.54 2.46M12 19v3m-4 0h8" />
                </svg>
              ) : (
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-50 rounded-full border border-neutral-200">
              {speakingUsers.size > 0 ? (
                <span className="text-xs font-medium text-emerald-600">
                  {Array.from(speakingUsers).map(uid => {
                    const p = participants.find(p => p.userId === uid)
                    return uid === user!.id ? 'You' : p?.name?.split(' ')[0] || 'Unknown'
                  }).join(', ')} speaking
                </span>
              ) : (
                <span className="text-xs text-neutral-400">Voice connected ({peerStates.size} peer{peerStates.size !== 1 ? 's' : ''})</span>
              )}
            </div>
            <button
              onClick={stopVoice}
              className="px-3 py-1.5 rounded-full bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-all active:scale-95"
            >
              Leave Voice
            </button>
          </>
        ) : (
          <button
            onClick={startVoice}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 hover:bg-emerald-50 border border-neutral-200 hover:border-emerald-300 text-neutral-600 hover:text-emerald-700 text-xs font-medium transition-all active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
            Join Voice
          </button>
        )}
      </div>
    </div>
  )
}
