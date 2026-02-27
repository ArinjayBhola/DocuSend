import { useCallback, useEffect, useRef, useState } from 'react'
import { sendSignal } from '../api/sessions'

interface Participant {
  userId: number
  name: string
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

export default function useVoiceChat(
  sessionId: number,
  userId: number,
  participants: Participant[],
  onSignalEvent?: (handler: (data: any) => void) => void
) {
  const [isActive, setIsActive] = useState(false) // Whether we are in the RTC mesh
  const [isMuted, setIsMuted] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [speakingUsers, setSpeakingUsers] = useState<Set<number>>(new Set())
  const [peerStates, setPeerStates] = useState<Map<number, string>>(new Map())
  const [remoteStreams, setRemoteStreams] = useState<Map<number, MediaStream>>(new Map())

  const localStreamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const peersRef = useRef<Map<number, RTCPeerConnection>>(new Map())
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const speakingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isActiveRef = useRef(false)
  const signalHandlerRef = useRef<((data: any) => void) | null>(null)

  // Keep ref in sync
  useEffect(() => { isActiveRef.current = isActive }, [isActive])

  const createPeerConnection = useCallback((remoteUserId: number, isInitiator: boolean) => {
    if (peersRef.current.has(remoteUserId)) {
      peersRef.current.get(remoteUserId)!.close()
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    peersRef.current.set(remoteUserId, pc)
    setPeerStates(prev => new Map(prev).set(remoteUserId, 'connecting'))

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!)
      })
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, screenStreamRef.current!)
      })
    }

    // Handle remote tracks
    pc.ontrack = (event) => {
      setRemoteStreams(prev => {
        const next = new Map(prev)
        const currentStream = next.get(remoteUserId) || new MediaStream()
        
        // Ensure new tracks are added to a NEW MediaStream object so React detects the change
        const newStream = new MediaStream(currentStream.getTracks())
        
        if (event.streams && event.streams[0]) {
          event.streams[0].getTracks().forEach(track => {
            if (!newStream.getTracks().find(t => t.id === track.id)) {
              newStream.addTrack(track)
            }
          })
        } else {
          // Fallback for track-only events
          if (!newStream.getTracks().find(t => t.id === event.track.id)) {
            newStream.addTrack(event.track)
          }
        }
        
        // Handle legacy audio-only path for background playback
        if (event.track.kind === 'audio') {
          const audio = new Audio()
          audio.srcObject = new MediaStream([event.track])
          audio.autoplay = true
          audio.play().catch(() => {})
        }

        next.set(remoteUserId, newStream)
        return next
      })
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal(sessionId, {
          targetUserId: remoteUserId,
          type: 'ice-candidate',
          payload: event.candidate,
        }).catch(() => {})
      }
    }

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState
      if (state === 'connected') {
        setPeerStates(prev => new Map(prev).set(remoteUserId, 'connected'))
      } else if (state === 'failed' || state === 'disconnected') {
        setPeerStates(prev => new Map(prev).set(remoteUserId, 'failed'))
      }
    }

    if (isInitiator) {
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() => {
          sendSignal(sessionId, {
            targetUserId: remoteUserId,
            type: 'offer',
            payload: pc.localDescription,
          }).catch(() => {})
        })
        .catch(console.error)
    }

    return pc
  }, [sessionId])

  const handleSignal = useCallback(async (data: any) => {
    const { fromUserId, signalType, payload } = data

    // If we're not active, we might need to become active to handle incoming signals properly
    // but typically we wait for manual join. 
    // HOWEVER, if someone is sending us an offer, we should probably handle it if we want to SEE them.
    if (!isActiveRef.current && signalType !== 'voice-state' && signalType !== 'screen-state') {
       // Auto-establish connection if we receive a relevant signal and want to be part of the room
       // But for DocuSend, we wait for a manual trigger for simplicity to avoid unwanted data use.
       return 
    }

    if (signalType === 'offer') {
      const pc = createPeerConnection(fromUserId, false)
      await pc.setRemoteDescription(new RTCSessionDescription(payload))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      sendSignal(sessionId, {
        targetUserId: fromUserId,
        type: 'answer',
        payload: pc.localDescription,
      }).catch(() => {})
    } else if (signalType === 'answer') {
      const pc = peersRef.current.get(fromUserId)
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(payload))
      }
    } else if (signalType === 'ice-candidate') {
      const pc = peersRef.current.get(fromUserId)
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(payload)).catch(() => {})
      }
    } else if (signalType === 'voice-state') {
      if (payload.active === false) {
        const pc = peersRef.current.get(fromUserId)
        if (pc) {
          pc.close()
          peersRef.current.delete(fromUserId)
          setPeerStates(prev => {
            const next = new Map(prev)
            next.delete(fromUserId)
            return next
          })
          setRemoteStreams(prev => {
             const next = new Map(prev)
             next.delete(fromUserId)
             return next
          })
        }
      }
    } else if (signalType === 'speaking') {
      setSpeakingUsers(prev => {
        const next = new Set(prev)
        if (payload.speaking) next.add(fromUserId)
        else next.delete(fromUserId)
        return next
      })
    } else if (signalType === 'renegotiate') {
       const pc = peersRef.current.get(fromUserId)
       if (pc) {
          pc.createOffer()
            .then(offer => pc.setLocalDescription(offer))
            .then(() => {
              sendSignal(sessionId, {
                targetUserId: fromUserId,
                type: 'offer',
                payload: pc.localDescription,
              }).catch(() => {})
            })
       }
    }
  }, [sessionId, createPeerConnection])

  // Establish peer connections with all participants
  const joinMesh = useCallback(() => {
    if (isActiveRef.current) return
    setIsActive(true)
    isActiveRef.current = true

    for (const p of participants) {
      if (p.userId !== userId) {
        createPeerConnection(p.userId, true)
        sendSignal(sessionId, {
          targetUserId: p.userId,
          type: 'voice-state',
          payload: { active: true },
        }).catch(() => {})
      }
    }
  }, [participants, userId, sessionId, createPeerConnection])

  // Store handler ref for external use
  useEffect(() => {
    signalHandlerRef.current = handleSignal
  }, [handleSignal])

  // Expose signal handler
  useEffect(() => {
    if (onSignalEvent) {
      onSignalEvent((data: any) => {
        signalHandlerRef.current?.(data)
      })
    }
  }, [onSignalEvent])

  const startSpeakingDetection = useCallback(() => {
    if (!localStreamRef.current) return

    const ctx = new AudioContext()
    const source = ctx.createMediaStreamSource(localStreamRef.current)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)

    audioContextRef.current = ctx
    analyserRef.current = analyser

    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    let wasSpeaking = false

    speakingIntervalRef.current = setInterval(() => {
      analyser.getByteFrequencyData(dataArray)
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
      const isSpeaking = avg > 20

      if (isSpeaking !== wasSpeaking) {
        wasSpeaking = isSpeaking
        setSpeakingUsers(prev => {
          const next = new Set(prev)
          if (isSpeaking) next.add(userId)
          else next.delete(userId)
          return next
        })
        // Broadcast speaking state to all peers
        for (const [remoteId] of peersRef.current) {
          sendSignal(sessionId, {
            targetUserId: remoteId,
            type: 'speaking',
            payload: { speaking: isSpeaking },
          }).catch(() => {})
        }
      }
    }, 100)
  }, [sessionId, userId])

  const startVoice = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      localStreamRef.current = stream
      
      joinMesh()
      startSpeakingDetection()
    } catch (err) {
      console.error('Failed to start voice:', err)
    }
  }, [joinMesh, startSpeakingDetection])

  const stopVoice = useCallback(() => {
    // Notify peers and cleanup
    for (const [remoteId, pc] of peersRef.current) {
      sendSignal(sessionId, {
        targetUserId: remoteId,
        type: 'voice-state',
        payload: { active: false },
      }).catch(() => {})
      pc.close()
    }
    peersRef.current.clear()
    setPeerStates(new Map())
    setRemoteStreams(new Map())

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop())
      localStreamRef.current = null
    }

    if (speakingIntervalRef.current) {
      clearInterval(speakingIntervalRef.current)
      speakingIntervalRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }

    setSpeakingUsers(new Set())
    setIsActive(false)
    setIsMuted(false)
  }, [sessionId])

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      screenStreamRef.current = stream
      setIsScreenSharing(true)

      // Establish mesh if not already active
      joinMesh()

      // Add tracks to all peers
      for (const [remoteId, pc] of peersRef.current) {
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream)
        })
        sendSignal(sessionId, {
            targetUserId: remoteId,
            type: 'renegotiate',
            payload: {}
        }).catch(() => {})
      }

      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare()
      }
    } catch (err) {
      console.error('Failed to start screen share:', err)
    }
  }, [sessionId, joinMesh])

  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop())
      screenStreamRef.current = null
      setIsScreenSharing(false)
      
      for (const [remoteId] of peersRef.current) {
          sendSignal(sessionId, {
              targetUserId: remoteId,
              type: 'renegotiate',
              payload: {}
          }).catch(() => {})
      }
    }
  }, [sessionId])

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isActiveRef.current) {
        for (const [, pc] of peersRef.current) pc.close()
        peersRef.current.clear()
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(t => t.stop())
        }
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(t => t.stop())
        }
        if (speakingIntervalRef.current) clearInterval(speakingIntervalRef.current)
        if (audioContextRef.current) audioContextRef.current.close().catch(() => {})
      }
    }
  }, [])

  return {
    isActive,
    isMuted,
    isScreenSharing,
    toggleMute,
    startVoice,
    stopVoice,
    startScreenShare,
    stopScreenShare,
    speakingUsers,
    peerStates,
    remoteStreams,
    joinMesh,
  }
}
