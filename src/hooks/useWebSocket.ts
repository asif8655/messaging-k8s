import { Client, type IMessage } from '@stomp/stompjs'
import { useCallback, useEffect, useRef, useState } from 'react'
import SockJS from 'sockjs-client'

import type { ChatPayload, Message } from '../types'

interface UseWebSocketOptions {
  enabled: boolean
  token: string | null
  onMessage: (message: Message) => void
}

export const useWebSocket = ({
  enabled,
  token,
  onMessage,
}: UseWebSocketOptions) => {
  const clientRef = useRef<Client | null>(null)
  const onMessageRef = useRef(onMessage)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  useEffect(() => {
    if (!enabled || !token) {
      return
    }

    const client = new Client({
      reconnectDelay: 5000,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      webSocketFactory: () => new SockJS(`${import.meta.env.VITE_WS_URL}?token=${token}`),
      debug: () => undefined,
      onConnect: () => {
        setIsConnected(true)
        setConnectionError(null)

        client.subscribe('/user/queue/messages', (frame: IMessage) => {
          try {
            const payload = JSON.parse(frame.body) as Message
            onMessageRef.current(payload)
          } catch {
            setConnectionError('Received an unreadable message from the server.')
          }
        })
      },
      onStompError: (frame) => {
        setIsConnected(false)
        setConnectionError(frame.headers.message ?? 'Messaging service error.')
      },
      onWebSocketClose: () => {
        setIsConnected(false)
      },
      onWebSocketError: () => {
        setIsConnected(false)
        setConnectionError('Unable to connect to the messaging service.')
      },
    })

    clientRef.current = client
    client.activate()

    return () => {
      setIsConnected(false)
      setConnectionError(null)

      if (clientRef.current === client) {
        clientRef.current = null
      }

      void client.deactivate()
    }
  }, [enabled, token])

  const send = useCallback((payload: ChatPayload): boolean => {
    const client = clientRef.current

    if (!client?.connected) {
      setConnectionError('Realtime messaging is currently unavailable.')
      return false
    }

    client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(payload),
    })

    return true
  }, [])

  return {
    isConnected,
    connectionError,
    send,
  }
}
