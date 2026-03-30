import { Client, type IMessage } from '@stomp/stompjs'
import { useCallback, useEffect, useRef, useState } from 'react'
import SockJS from 'sockjs-client'

import type { CallEventRequest, CallEventResponse, ChatPayload, Message, StreamEventResponse, VideoCallSignal, VideoCallSignalResponse } from '../types'

interface UseWebSocketOptions {
  enabled: boolean
  token: string | null
  onMessage: (message: Message) => void
  onVideoSignal?: (signal: VideoCallSignalResponse) => void
  onCallEvent?: (event: CallEventResponse) => void
  onStreamEvent?: (event: StreamEventResponse) => void
}

export const useWebSocket = ({
  enabled,
  token,
  onMessage,
  onVideoSignal,
  onCallEvent,
  onStreamEvent,
}: UseWebSocketOptions) => {
  const clientRef = useRef<Client | null>(null)
  const onMessageRef = useRef(onMessage)
  const onVideoSignalRef = useRef(onVideoSignal)
  const onCallEventRef = useRef(onCallEvent)
  const onStreamEventRef = useRef(onStreamEvent)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  useEffect(() => {
    onVideoSignalRef.current = onVideoSignal
  }, [onVideoSignal])

  useEffect(() => {
    onCallEventRef.current = onCallEvent
  }, [onCallEvent])

  useEffect(() => {
    onStreamEventRef.current = onStreamEvent
  }, [onStreamEvent])

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

        client.subscribe('/user/queue/video-signal', (frame: IMessage) => {
          try {
            const signal = JSON.parse(frame.body) as VideoCallSignalResponse
            onVideoSignalRef.current?.(signal)
          } catch {
            // Silently ignore malformed video signals
          }
        })

        client.subscribe('/user/queue/call-event', (frame: IMessage) => {
          try {
            const event = JSON.parse(frame.body) as CallEventResponse
            onCallEventRef.current?.(event)
          } catch {
            // Silently ignore malformed call events
          }
        })

        // Subscribe to broadcast stream events (stream started / ended)
        client.subscribe('/topic/stream-events', (frame: IMessage) => {
          try {
            const event = JSON.parse(frame.body) as StreamEventResponse
            onStreamEventRef.current?.(event)
          } catch {
            // Silently ignore malformed stream events
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

  const sendVideoSignal = useCallback((signal: VideoCallSignal): boolean => {
    const client = clientRef.current

    if (!client?.connected) {
      return false
    }

    client.publish({
      destination: '/app/video.signal',
      body: JSON.stringify(signal),
    })

    return true
  }, [])

  const sendCallEvent = useCallback((event: CallEventRequest): boolean => {
    const client = clientRef.current

    if (!client?.connected) {
      return false
    }

    client.publish({
      destination: '/app/call.event',
      body: JSON.stringify(event),
    })

    return true
  }, [])

  return {
    isConnected,
    connectionError,
    send,
    sendVideoSignal,
    sendCallEvent,
  }
}
