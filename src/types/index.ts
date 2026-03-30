export interface User {
  id: string
  email: string
  fullName: string
  isVerified: boolean
  isSuperUser: boolean
}

export interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  isRead: boolean
  sentAt: string
}

export interface AuthResponse {
  accessToken: string
  tokenType: string
  user: User
}

export interface ChatPayload {
  receiverId: string
  content: string
}

export interface ApiErrorResponse {
  message?: string
  error?: string
  status?: number
}

export type VideoSignalType =
  | 'call-offer'
  | 'call-answer'
  | 'ice-candidate'
  | 'call-end'
  | 'call-reject'

export interface VideoCallSignal {
  targetUserId: string
  type: VideoSignalType
  sdp?: string
  candidate?: string
  sdpMLineIndex?: number
  sdpMid?: string
}

export interface VideoCallSignalResponse {
  fromUserId: string
  fromUserName: string
  type: VideoSignalType
  sdp?: string
  candidate?: string
  sdpMLineIndex?: number
  sdpMid?: string
}

// Agora RTC Types
export type CallEventType = 'call-start' | 'call-accept' | 'call-reject' | 'call-end'
export type AgoraCallType = 'audio' | 'video'

export interface RtcTokenRequest {
  channelName: string
  targetUserId: string
  role?: number
}

export interface RtcTokenResponse {
  token: string
  appId: string
  channelName: string
  uid: number | string
  expiresIn: number
}

export interface CallEventRequest {
  targetUserId: string
  eventType: CallEventType
  channelName?: string
}

export interface CallEventResponse {
  fromUserId: string
  fromUserName: string
  eventType: CallEventType
  channelName?: string
}

// Live Streaming Types
export interface StreamRequest {
  title: string
  description?: string
}

export interface ViewerInfo {
  userId: string
  fullName: string
}

export interface StreamResponse {
  streamId: string
  channelName: string
  title: string
  description?: string
  hostId: string
  hostName: string
  token?: string
  appId?: string
  /** Numeric UID used when generating the Agora token — must be passed to client.join() */
  agoraUid: number
  isActive: boolean
  isStreamHost: boolean
  active?: boolean
  streamHost?: boolean
  startedAt: string
  viewerCount: number
  viewers?: ViewerInfo[]
}

export interface StreamEventRequest {
  streamId: string
  eventType: 'stream-started' | 'stream-ended' | 'viewer-joined' | 'viewer-left'
}

export interface StreamEventResponse {
  streamId: string
  channelName?: string
  title?: string
  eventType: string
  hostId: string
  hostName: string
  viewerCount?: number
}
