import type { RtcTokenRequest, RtcTokenResponse } from '../types'
import { axiosInstance } from './axiosInstance'

type RtcTokenPayload = Partial<RtcTokenResponse> & {
  appID?: string
  agoraUid?: number | string
  channel?: string
}

const normalizeRtcTokenResponse = (payload: RtcTokenPayload): RtcTokenResponse => {
  const appId = (payload.appId ?? payload.appID ?? '').trim()
  const uid = payload.uid ?? payload.agoraUid ?? ''
  const channelName = (payload.channelName ?? payload.channel ?? '').trim()

  return {
    token: payload.token ?? '',
    appId,
    channelName,
    uid,
    expiresIn: payload.expiresIn ?? 0,
  }
}

export const generateRtcToken = async (request: RtcTokenRequest): Promise<RtcTokenResponse> => {
  const response = await axiosInstance.post<RtcTokenPayload>('/rtc/token', request)
  return normalizeRtcTokenResponse(response.data)
}

export const getAgoraAppId = async (): Promise<string> => {
  const response = await axiosInstance.get<string>('/rtc/app-id')
  return response.data
}
