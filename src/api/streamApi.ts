import type { StreamRequest, StreamResponse } from '../types'
import { axiosInstance } from './axiosInstance'

type StreamResponsePayload = StreamResponse & {
  active?: boolean
  streamHost?: boolean
}

const normalizeStreamResponse = (payload: StreamResponsePayload): StreamResponse => ({
  ...payload,
  appId: payload.appId?.trim(),
  channelName: payload.channelName.trim(),
  isActive: payload.isActive ?? payload.active ?? false,
  isStreamHost: payload.isStreamHost ?? payload.streamHost ?? false,
})

export const startStream = async (request: StreamRequest): Promise<StreamResponse> => {
  const response = await axiosInstance.post<StreamResponsePayload>('/stream/start', request)
  return normalizeStreamResponse(response.data)
}

export const joinStream = async (streamId: string): Promise<StreamResponse> => {
  const response = await axiosInstance.post<StreamResponsePayload>(`/stream/${streamId}/join`)
  return normalizeStreamResponse(response.data)
}

export const endStream = async (streamId: string): Promise<void> => {
  await axiosInstance.post(`/stream/${streamId}/end`)
}

export const leaveStream = async (streamId: string): Promise<void> => {
  await axiosInstance.post(`/stream/${streamId}/leave`)
}

export const getActiveStream = async (): Promise<StreamResponse | null> => {
  try {
    const response = await axiosInstance.get<StreamResponsePayload>('/stream/active')
    return normalizeStreamResponse(response.data)
  } catch (error) {
    return null
  }
}
