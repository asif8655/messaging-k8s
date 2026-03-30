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
import {
  deleteAllMessagesForMe,
  deleteMessageForBoth,
  deleteMessageForMe,
  getConversation,
  sendMessageRequest,
} from '../api/messageApi'
import { deleteUser, getUsers } from '../api/userApi'
import type { IAgoraRTCRemoteUser, ILocalVideoTrack } from 'agora-rtc-sdk-ng'
import { useMessages } from '../hooks/useMessages'
import { useAgoraCall, type AgoraCallStatus } from '../hooks/useAgoraCall'
import { useWebSocket } from '../hooks/useWebSocket'
import type {
  AgoraCallType,
  CallEventResponse,
  ChatPayload,
  Message,
  StreamEventResponse,
  User,
} from '../types'

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
  clearActiveUser: () => void
  sendMessage: (content: string) => Promise<void>
  refreshUsers: () => Promise<void>
  deleteMessageForMe: (messageId: string) => Promise<void>
  deleteMessageForBoth: (messageId: string) => Promise<void>
  deleteConversationForMe: (userId: string) => Promise<void>
  deleteUser: (userId: string) => Promise<void>
  // Video call
  callStatus: AgoraCallStatus
  callType: AgoraCallType
  callError: string | null
  remoteUserId: string | null
  remoteUserName: string | null
  localVideoTrack: ILocalVideoTrack | null
  remoteUsers: IAgoraRTCRemoteUser[]
  isMuted: boolean
  isSpeakerOff: boolean
  isVideoOff: boolean
  isSharingScreen: boolean
  startCall: (targetUserId: string, targetUserName: string, videoEnabled?: boolean) => Promise<void>
  acceptCall: () => Promise<void>
  rejectCall: () => void
  endCall: () => void
  toggleMute: () => Promise<void>
  toggleSpeaker: () => void
  toggleVideo: () => Promise<void>
  toggleScreenShare: () => Promise<void>
  // Stream events
  registerStreamEventHandler: (handler: ((event: StreamEventResponse) => void) | null) => void
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
  const streamEventHandlerRef = useRef<((event: StreamEventResponse) => void) | null>(null)

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
  }, [clearMessages, hydrateUnreadCounts, isAuthenticated, user])

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

  const callRef = useRef<{
    handleIncomingCall: (fromUserId: string, fromUserName: string, channelName: string) => void
    handleCallAccepted: (event?: CallEventResponse) => void
    handleCallRejected: (event?: CallEventResponse) => void
    handleCallEnded: (event?: CallEventResponse) => void
  } | null>(null)

  const handleIncomingCallEvent = useCallback((event: CallEventResponse) => {
    console.info('[ws] call event received', event)
    switch (event.eventType) {
      case 'call-start':
        if (event.channelName) {
          callRef.current?.handleIncomingCall(event.fromUserId, event.fromUserName, event.channelName)
        }
        break
      case 'call-accept':
        callRef.current?.handleCallAccepted(event)
        break
      case 'call-reject':
        callRef.current?.handleCallRejected(event)
        break
      case 'call-end':
        callRef.current?.handleCallEnded(event)
        break
    }
  }, [])

  const handleIncomingStreamEvent = useCallback((event: StreamEventResponse) => {
    streamEventHandlerRef.current?.(event)
  }, [])

  const registerStreamEventHandler = useCallback(
    (handler: ((event: StreamEventResponse) => void) | null) => {
      streamEventHandlerRef.current = handler
    },
    [],
  )

  const { isConnected, connectionError, sendCallEvent } = useWebSocket({
    enabled: isAuthenticated,
    token,
    onMessage: handleIncomingMessage,
    onCallEvent: handleIncomingCallEvent,
    onStreamEvent: handleIncomingStreamEvent,
  })

  const videoCall = useAgoraCall({
    currentUserId: user?.id ?? null,
    sendCallEvent,
  })

  useEffect(() => {
    callRef.current = videoCall
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

  const handleDeleteMessageForMe = useCallback(
    async (messageId: string) => {
      try {
        await deleteMessageForMe(messageId)
        removeMessage(messageId)
      } catch (err) {
        setMessagesError(getApiErrorMessage(err, 'Unable to delete message.'))
      }
    },
    [removeMessage, setMessagesError],
  )

  const handleDeleteMessageForBoth = useCallback(
    async (messageId: string) => {
      try {
        await deleteMessageForBoth(messageId)
        removeMessage(messageId)
      } catch (err) {
        setMessagesError(getApiErrorMessage(err, 'Unable to delete message.'))
      }
    },
    [removeMessage, setMessagesError],
  )

  const handleDeleteConversationForMe = useCallback(
    async (userId: string) => {
      try {
        await deleteAllMessagesForMe(userId)

        if (activeUser?.id === userId) {
          clearMessages()
        }

        setUnreadCounts((currentCounts) => {
          const nextCounts = new Map(currentCounts)
          nextCounts.delete(userId)
          return nextCounts
        })
      } catch (err) {
        setMessagesError(getApiErrorMessage(err, 'Unable to delete chat.'))
      }
    },
    [activeUser, clearMessages, setMessagesError],
  )

  const handleDeleteUser = useCallback(
    async (userId: string) => {
      try {
        await deleteUser(userId)

        if (activeUser?.id === userId) {
          setActiveUser(null)
          clearMessages()
        }

        await refreshUsers(true)
      } catch (err) {
        setUsersError(getApiErrorMessage(err, 'Unable to delete user.'))
      }
    },
    [activeUser, clearMessages, refreshUsers],
  )

  const clearActiveUser = useCallback(() => {
    setActiveUser(null)
    clearMessages()
    setMessagesError(null)
  }, [clearMessages, setMessagesError])

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
        clearActiveUser,
        sendMessage,
        refreshUsers,
        deleteMessageForMe: handleDeleteMessageForMe,
        deleteMessageForBoth: handleDeleteMessageForBoth,
        deleteConversationForMe: handleDeleteConversationForMe,
        deleteUser: handleDeleteUser,
        // Video call
        callStatus: videoCall.callStatus,
        callType: videoCall.callType,
        callError: videoCall.callError,
        remoteUserId: videoCall.remoteUserId,
        remoteUserName: videoCall.remoteUserName,
        localVideoTrack: videoCall.localVideoTrack,
        remoteUsers: videoCall.remoteUsers,
        isMuted: videoCall.isMuted,
        isSpeakerOff: videoCall.isSpeakerOff,
        isVideoOff: videoCall.isVideoOff,
        isSharingScreen: videoCall.isSharingScreen,
        startCall: videoCall.startCall,
        acceptCall: videoCall.acceptCall,
        rejectCall: videoCall.rejectCall,
        endCall: videoCall.endCall,
        toggleMute: videoCall.toggleMute,
        toggleSpeaker: videoCall.toggleSpeaker,
        toggleVideo: videoCall.toggleVideo,
        toggleScreenShare: videoCall.toggleScreenShare,
        // Stream events
        registerStreamEventHandler,
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
