import { get, post, put, del } from './client'

export const createSession = (data: { documentId: number; title: string; maxParticipants?: number }) =>
  post('/sessions', data)

export const listSessions = () => get('/sessions')

export const getSession = (id: number) => get(`/sessions/${id}`)

export const joinSession = (code: string) => post('/sessions/join', { code })

export const startSession = (id: number) => post(`/sessions/${id}/start`, {})

export const endSession = (id: number) => post(`/sessions/${id}/end`, {})

export const leaveSession = (id: number) => post(`/sessions/${id}/leave`, {})

export const updatePresence = (id: number, data: { currentPage?: number; cursorX?: number; cursorY?: number }) =>
  post(`/sessions/${id}/presence`, data)

export const createAnnotation = (id: number, data: { pageNumber: number; type: string; data: any; color: string }) =>
  post(`/sessions/${id}/annotations`, data)

export const updateAnnotation = (sessionId: number, annotationId: number, data: { data?: any; resolved?: boolean }) =>
  put(`/sessions/${sessionId}/annotations/${annotationId}`, data)

export const deleteAnnotation = (sessionId: number, annotationId: number) =>
  del(`/sessions/${sessionId}/annotations/${annotationId}`)

export const getAnnotations = (id: number) => get(`/sessions/${id}/annotations`)

export const sendMessage = (id: number, data: { content: string; annotationId?: number }) =>
  post(`/sessions/${id}/messages`, data)

export const getMessages = (id: number) => get(`/sessions/${id}/messages`)

export const sendTyping = (id: number, isTyping: boolean) =>
  post(`/sessions/${id}/typing`, { isTyping })

export const toggleHandRaise = (id: number) =>
  post(`/sessions/${id}/hand-raise`, {})

export const toggleScreenShare = (id: number) =>
  post(`/sessions/${id}/screen-share`, {})

export const sendSignal = (id: number, data: { targetUserId: number; type: string; payload: any }) =>
  post(`/sessions/${id}/signal`, data)
