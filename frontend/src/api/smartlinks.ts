import { get, post, put, del } from './client'

export const createSmartLink = (data: {
  documentId: number
  recipientEmail: string
  recipientName?: string
  allowDownload?: boolean
  requirePassword?: boolean
  password?: string
  expiresAt?: string
  maxViews?: number
}) => post('/smartlinks', data)

export const listSmartLinks = (params?: { documentId?: number; limit?: number; offset?: number }) => {
  const query = new URLSearchParams()
  if (params?.documentId) query.set('documentId', String(params.documentId))
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.offset) query.set('offset', String(params.offset))
  const qs = query.toString()
  return get(`/smartlinks${qs ? `?${qs}` : ''}`)
}

export const getSmartLink = (id: number) => get(`/smartlinks/${id}`)

export const updateSmartLink = (id: number, data: {
  recipientName?: string
  allowDownload?: boolean
  requirePassword?: boolean
  password?: string | null
  expiresAt?: string | null
  isActive?: boolean
  maxViews?: number | null
}) => put(`/smartlinks/${id}`, data)

export const deleteSmartLink = (id: number) => del(`/smartlinks/${id}`)

export const duplicateSmartLink = (id: number) => post(`/smartlinks/${id}/duplicate`, {})
