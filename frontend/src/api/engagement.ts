import { get } from './client'

export const getEngagementScores = (params?: { classification?: string; sortBy?: string; limit?: number; offset?: number }) => {
  const query = new URLSearchParams()
  if (params?.classification) query.set('classification', params.classification)
  if (params?.sortBy) query.set('sortBy', params.sortBy)
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.offset) query.set('offset', String(params.offset))
  const qs = query.toString()
  return get(`/engagement/scores${qs ? `?${qs}` : ''}`)
}

export const getDocumentScores = (documentId: number) =>
  get(`/engagement/scores/${documentId}`)

export const getFollowUpSuggestions = (params?: { priority?: string; limit?: number }) => {
  const query = new URLSearchParams()
  if (params?.priority) query.set('priority', params.priority)
  if (params?.limit) query.set('limit', String(params.limit))
  const qs = query.toString()
  return get(`/engagement/follow-ups${qs ? `?${qs}` : ''}`)
}

export const getDocumentPerformance = (params?: { sortBy?: string; limit?: number }) => {
  const query = new URLSearchParams()
  if (params?.sortBy) query.set('sortBy', params.sortBy)
  if (params?.limit) query.set('limit', String(params.limit))
  const qs = query.toString()
  return get(`/engagement/documents/performance${qs ? `?${qs}` : ''}`)
}
