export interface User {
  id: string
  email: string
  fullName: string
  isVerified: boolean
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

