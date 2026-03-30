import type { ChatPayload, Message } from '../types'

import { axiosInstance } from './axiosInstance'

export const getConversation = async (userId: string): Promise<Message[]> => {
  const response = await axiosInstance.get<Message[]>(`/messages/${userId}`)
  return response.data
}

export const sendMessageRequest = async (payload: ChatPayload): Promise<Message> => {
  const response = await axiosInstance.post<Message>('/messages', payload)
  return response.data
}

export const markRead = async (userId: string): Promise<void> => {
  await axiosInstance.put(`/messages/${userId}/read`)
}

export const deleteMessageForMe = async (messageId: string): Promise<void> => {
  await axiosInstance.delete(`/messages/${messageId}/delete-for-me`)
}

export const deleteMessageForBoth = async (messageId: string): Promise<void> => {
  await axiosInstance.delete(`/messages/${messageId}/delete-for-both`)
}

export const deleteAllMessagesForMe = async (userId: string): Promise<void> => {
  await axiosInstance.delete(`/messages/${userId}/delete-all-for-me`)
}
