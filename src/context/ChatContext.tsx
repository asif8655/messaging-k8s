import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { getApiErrorMessage } from '../api/authApi'
import { getConversation, sendMessageRequest } from '../api/messageApi'
import { getUsers } from '../api/userApi'
import { useMessages } from '../hooks/useMessages'
import { useWebSocket } from '../hooks/useWebSocket'
import type { ChatPayload, Message, User } from '../types'

import { useAuth } from './AuthContext'

interface ChatContextValue {
  users: User[]
  usersLoading: boolean
  usersError: string | null
  activeUser: User | null
  messages: Message[]
  messagesLoading: boolean
  messagesError: string | null
  unreadCounts: Map<string, number>
  isConnected: boolean
  connectionError: string | null
  isSending: boolean
  selectUser: (user: User) => Promise<void>
  sendMessage: (content: string) => Promise<void>
  refreshUsers: () => Promise<void>
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined)

const belongsToConversation = (
  message: Message,
  currentUserId: string,
  activeUserId: string,
): boolean =>
  (message.senderId === currentUserId && message.receiverId === activeUserId) ||
  (message.senderId === activeUserId && message.receiverId === currentUserId)

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { user, token, isAuthenticated } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [activeUser, setActiveUser] = useState<User | null>(null)
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map())
  const [isSending, setIsSending] = useState(false)
  const activeUserRef = useRef<User | null>(null)

  const {
    messages,
    isLoading: messagesLoading,
    error: messagesError,
    loadConversation,
    appendMessage,
    removeMessage,
    clearMessages,
    markConversationRead,
    setMessagesError,
  } = useMessages()

  useEffect(() => {
    activeUserRef.current = activeUser
  }, [activeUser])

  const hydrateUnreadCounts = useCallback(async (chatUsers: User[]) => {
    const results = await Promise.allSettled(
      chatUsers.map(async (chatUser) => {
        const history = await getConversation(chatUser.id)
        const unreadCount = history.filter(
          (message) => message.senderId === chatUser.id && !message.isRead,
        ).length

        return [chatUser.id, unreadCount] as const
      }),
    )

    const nextCounts = new Map<string, number>()

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value[1] > 0) {
        nextCounts.set(result.value[0], result.value[1])
      }
    })

    setUnreadCounts(nextCounts)
  }, [])

  const refreshUsers = useCallback(async (isBackground = false) => {
    if (!isAuthenticated) {
      return
    }

    if (!isBackground) {
      setUsersLoading(true)
      setUsersError(null)
    }

    try {
      const availableUsers = await getUsers()
      
      // Only update users if they changed to prevent extra renders
      setUsers((prev) => JSON.stringify(prev) === JSON.stringify(availableUsers) ? prev : availableUsers)
      void hydrateUnreadCounts(availableUsers)

      if (
        activeUserRef.current &&
        !availableUsers.some((chatUser) => chatUser.id === activeUserRef.current?.id)
      ) {
        setActiveUser(null)
        clearMessages()
      }
    } catch (loadError) {
      if (!isBackground) {
        setUsersError(getApiErrorMessage(loadError, 'Unable to load users.'))
      }
    } finally {
      if (!isBackground) {
        setUsersLoading(false)
      }
    }
  }, [clearMessages, hydrateUnreadCounts, isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) {
      setUsers([])
      setUsersError(null)
      setActiveUser(null)
      setUnreadCounts(new Map())
      setIsSending(false)
      clearMessages()
      return
    }

    void refreshUsers()
  }, [clearMessages, isAuthenticated, refreshUsers])

  const handleIncomingMessage = useCallback(
    (message: Message) => {
      if (!user) {
        return
      }

      const selectedUser = activeUserRef.current

      startTransition(() => {
        if (selectedUser && belongsToConversation(message, user.id, selectedUser.id)) {
          appendMessage(message)
        }

        if (message.senderId === user.id) {
          return
        }

        if (selectedUser?.id === message.senderId) {
          setUnreadCounts((currentCounts) => {
            const nextCounts = new Map(currentCounts)
            nextCounts.delete(message.senderId)
            return nextCounts
          })
          void markConversationRead(message.senderId)
          return
        }

        setUnreadCounts((currentCounts) => {
          const nextCounts = new Map(currentCounts)
          nextCounts.set(message.senderId, (nextCounts.get(message.senderId) ?? 0) + 1)
          return nextCounts
        })
      })
    },
    [appendMessage, markConversationRead, user],
  )

  const { isConnected, connectionError } = useWebSocket({
    enabled: isAuthenticated,
    token,
    onMessage: handleIncomingMessage,
  })

  const selectUser = useCallback(
    async (chatUser: User) => {
      startTransition(() => {
        setActiveUser(chatUser)
      })

      setMessagesError(null)
      await loadConversation(chatUser.id)

      setUnreadCounts((currentCounts) => {
        const nextCounts = new Map(currentCounts)
        nextCounts.delete(chatUser.id)
        return nextCounts
      })

      await markConversationRead(chatUser.id)
    },
    [loadConversation, markConversationRead, setMessagesError],
  )

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmedContent = content.trim()

      if (!trimmedContent || !activeUser || !user) {
        return
      }

      setIsSending(true)
      setMessagesError(null)

      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        senderId: user.id,
        receiverId: activeUser.id,
        content: trimmedContent,
        isRead: false,
        sentAt: new Date().toISOString(),
      }

      appendMessage(optimisticMessage)

      try {
        const payload: ChatPayload = {
          receiverId: activeUser.id,
          content: trimmedContent,
        }

        const savedMessage = await sendMessageRequest(payload)
        startTransition(() => {
          appendMessage(savedMessage)
        })
      } catch (err) {
        removeMessage(optimisticMessage.id)
        setMessagesError('Unable to send the message right now.')
      } finally {
        setIsSending(false)
      }
    },
    [
      activeUser,
      appendMessage,
      removeMessage,
      setMessagesError,
      user,
    ],
  )

  return (
    <ChatContext.Provider
      value={{
        users,
        usersLoading,
        usersError,
        activeUser,
        messages,
        messagesLoading,
        messagesError,
        unreadCounts,
        isConnected,
        connectionError,
        isSending,
        selectUser,
        sendMessage,
        refreshUsers,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useChat = (): ChatContextValue => {
  const context = useContext(ChatContext)

  if (!context) {
    throw new Error('useChat must be used within a ChatProvider.')
  }

  return context
}
