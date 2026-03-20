import { useCallback, useState } from 'react'

import { getApiErrorMessage } from '../api/authApi'
import { getConversation, markRead } from '../api/messageApi'
import type { Message } from '../types'

const TEMP_ID_PREFIX = 'temp-'

const toTimestamp = (value: string): number => {
  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

const sortMessages = (messages: Message[]): Message[] =>
  [...messages].sort((left, right) => toTimestamp(left.sentAt) - toTimestamp(right.sentAt))

const matchesOptimisticMessage = (existing: Message, incoming: Message): boolean =>
  existing.id.startsWith(TEMP_ID_PREFIX) &&
  existing.senderId === incoming.senderId &&
  existing.receiverId === incoming.receiverId &&
  existing.content === incoming.content &&
  Math.abs(toTimestamp(existing.sentAt) - toTimestamp(incoming.sentAt)) < 15000

export const upsertMessage = (messages: Message[], incoming: Message): Message[] => {
  const nextMessages = [...messages]
  const existingIndex = nextMessages.findIndex(
    (message) => message.id === incoming.id || matchesOptimisticMessage(message, incoming),
  )

  if (existingIndex >= 0) {
    nextMessages[existingIndex] = incoming
  } else {
    nextMessages.push(incoming)
  }

  return sortMessages(nextMessages)
}

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadConversation = useCallback(async (userId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const conversation = await getConversation(userId)
      setMessages(sortMessages(conversation))
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Unable to load this conversation.'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const appendMessage = useCallback((message: Message) => {
    setMessages((currentMessages) => upsertMessage(currentMessages, message))
  }, [])

  const removeMessage = useCallback((messageId: string) => {
    setMessages((currentMessages) =>
      currentMessages.filter((message) => message.id !== messageId),
    )
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  const markConversationRead = useCallback(async (userId: string) => {
    try {
      await markRead(userId)
      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.senderId === userId ? { ...message, isRead: true } : message,
        ),
      )
    } catch (markError) {
      setError(getApiErrorMessage(markError, 'Unable to mark messages as read.'))
    }
  }, [])

  const setMessagesError = useCallback((nextError: string | null) => {
    setError(nextError)
  }, [])

  return {
    messages,
    isLoading,
    error,
    loadConversation,
    appendMessage,
    removeMessage,
    clearMessages,
    markConversationRead,
    setMessagesError,
  }
}

