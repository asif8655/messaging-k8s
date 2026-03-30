import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ILocalAudioTrack,
  ILocalVideoTrack,
} from 'agora-rtc-sdk-ng'
import { useCallback, useEffect, useRef, useState } from 'react'

import { endStream, getActiveStream, joinStream, leaveStream, startStream } from '../api/streamApi'
import {
  AGORA_DIRECT_FRONTEND_MODE,
  AGORA_FRONTEND_APP_ID,
  AGORA_CONFIG,
  AgoraRTC,
  createAgoraLiveClient,
} from '../config/agoraConfig'
import type { StreamResponse } from '../types'

const SESSION_KEY = 'messagingapp_active_stream_id'

export interface UseStreamReturn {
  isStreaming: boolean
  isHost: boolean
  streamInfo: StreamResponse | null
  localVideoTrack: ILocalVideoTrack | null
  localAudioTrack: ILocalAudioTrack | null
  remoteUsers: IAgoraRTCRemoteUser[]
  isMuted: boolean
  isSpeakerOff: boolean
  isVideoOff: boolean
  isSharingScreen: boolean
  isConnecting: boolean
  agoraError: string | null
  isRestoring: boolean
  startLiveStream: (title: string, description: string) => Promise<void>
  joinLiveStream: (streamId: string) => Promise<void>
  refreshStreamInfo: () => Promise<StreamResponse | null>
  endLiveStream: () => Promise<void>
  leaveLiveStream: () => Promise<void>
  toggleMute: () => Promise<void>
  toggleSpeaker: () => void
  toggleVideo: () => Promise<void>
  toggleScreenShare: () => Promise<void>
  error: string | null
}

export const useStream = (currentUserId: string | null): UseStreamReturn => {
  const [isStreaming, setIsStreaming] = useState(false)
  const [isHost, setIsHost] = useState(false)
  const [streamInfo, setStreamInfo] = useState<StreamResponse | null>(null)
  const [localVideoTrack, setLocalVideoTrack] = useState<ILocalVideoTrack | null>(null)
  const [localAudioTrack, setLocalAudioTrack] = useState<ILocalAudioTrack | null>(null)
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOff, setIsSpeakerOff] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isSharingScreen, setIsSharingScreen] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [agoraError, setAgoraError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)

  const clientRef = useRef<IAgoraRTCClient | null>(null)
  const screenTrackRef = useRef<ILocalVideoTrack | null>(null)
  const originalVideoTrackRef = useRef<ILocalVideoTrack | null>(null)
  const streamIdRef = useRef<string | null>(null)
  const joinLiveStreamRef = useRef<((id: string) => Promise<void>) | null>(null)
  const localVideoTrackRef = useRef<ILocalVideoTrack | null>(null)
  const localAudioTrackRef = useRef<ILocalAudioTrack | null>(null)
  const remoteUsersRef = useRef<IAgoraRTCRemoteUser[]>([])

  useEffect(() => {
    localVideoTrackRef.current = localVideoTrack
  }, [localVideoTrack])

  useEffect(() => {
    localAudioTrackRef.current = localAudioTrack
  }, [localAudioTrack])

  useEffect(() => {
    remoteUsersRef.current = remoteUsers
  }, [remoteUsers])

  const upsertRemoteUser = useCallback((user: IAgoraRTCRemoteUser) => {
    setRemoteUsers((prev) => {
      const index = prev.findIndex((remoteUser) => remoteUser.uid === user.uid)
      if (index === -1) {
        return [...prev, user]
      }

      const next = [...prev]
      next[index] = user
      return next
    })
  }, [])

  const syncRemoteUser = useCallback((user: IAgoraRTCRemoteUser) => {
    if (user.videoTrack || user.audioTrack || user.hasAudio || user.hasVideo) {
      upsertRemoteUser(user)
      return
    }

    setRemoteUsers((prev) => prev.filter((remoteUser) => remoteUser.uid !== user.uid))
  }, [upsertRemoteUser])

  const createOptionalCameraTrack = useCallback(async () => {
    try {
      return await AgoraRTC.createCameraVideoTrack({
        encoderConfig: AGORA_CONFIG.videoEncoderConfig,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes('DEVICE_NOT_FOUND') || message.includes('Requested device not found')) {
        console.warn('[stream] camera not available, continuing without video')
        setAgoraError('Camera not found. Stream started with audio only.')
        return null
      }

      throw error
    }
  }, [])

  const createOptionalMicrophoneTrack = useCallback(async () => {
    try {
      return await AgoraRTC.createMicrophoneAudioTrack()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes('DEVICE_NOT_FOUND') || message.includes('Requested device not found') || message.includes('NotAllowedError')) {
        console.warn('[stream] microphone not available, continuing in listen-only mode')
        setAgoraError('Microphone not available. You joined in listen-only mode.')
        return null
      }

      throw error
    }
  }, [])

  const isSpeakerOffRef = useRef(isSpeakerOff)

  useEffect(() => {
    isSpeakerOffRef.current = isSpeakerOff
  }, [isSpeakerOff])

  useEffect(() => {
    const client = createAgoraLiveClient()
    clientRef.current = client

    client.on('user-published', async (user, mediaType) => {
      await client.subscribe(user, mediaType)
      syncRemoteUser(user)
      if (mediaType === 'audio') {
        if (isSpeakerOffRef.current) {
          user.audioTrack?.stop()
        } else {
          user.audioTrack?.play()
        }
      }
    })

    client.on('user-unpublished', (user, mediaType) => {
      if (mediaType === 'audio') {
        user.audioTrack?.stop()
      }

      syncRemoteUser(user)
    })

    client.on('user-left', (user) => {
      setRemoteUsers((prev) => prev.filter((remoteUser) => remoteUser.uid !== user.uid))
    })

    return () => {
      client.removeAllListeners()
    }
  }, [syncRemoteUser])

  useEffect(() => {
    remoteUsers.forEach((user) => {
      if (!user.audioTrack) {
        return
      }

      if (isSpeakerOff) {
        user.audioTrack.stop()
      } else {
        user.audioTrack.play()
      }
    })
  }, [isSpeakerOff, remoteUsers])

  const cleanupTracks = useCallback(async () => {
    const client = clientRef.current
    const currentLocalVideoTrack = localVideoTrackRef.current
    const currentLocalAudioTrack = localAudioTrackRef.current
    const originalVideoTrack = originalVideoTrackRef.current
    const publishedTracks = [screenTrackRef.current, currentLocalVideoTrack, currentLocalAudioTrack].filter(
      Boolean,
    ) as Array<ILocalVideoTrack | ILocalAudioTrack>

    remoteUsersRef.current.forEach((user) => {
      user.audioTrack?.stop()
      user.videoTrack?.stop()
    })

    if (client && client.connectionState !== 'DISCONNECTED' && publishedTracks.length > 0) {
      try {
        await client.unpublish(publishedTracks)
      } catch {
        // best effort
      }
    }

    if (screenTrackRef.current) {
      screenTrackRef.current.stop()
      screenTrackRef.current.close()
      screenTrackRef.current = null
    }

    if (currentLocalVideoTrack) {
      currentLocalVideoTrack.stop()
      currentLocalVideoTrack.close()
      localVideoTrackRef.current = null
      setLocalVideoTrack(null)
    }

    if (originalVideoTrack && originalVideoTrack !== currentLocalVideoTrack) {
      originalVideoTrack.stop()
      originalVideoTrack.close()
    }
    originalVideoTrackRef.current = null

    if (currentLocalAudioTrack) {
      currentLocalAudioTrack.stop()
      currentLocalAudioTrack.close()
      localAudioTrackRef.current = null
      setLocalAudioTrack(null)
    }

    if (client && client.connectionState !== 'DISCONNECTED') {
      await client.leave()
    }

    setRemoteUsers([])
    setIsStreaming(false)
    setIsHost(false)
    setStreamInfo(null)
    setIsMuted(false)
    setIsSpeakerOff(false)
    setIsVideoOff(false)
    setIsSharingScreen(false)
    setIsConnecting(false)
    setAgoraError(null)
    streamIdRef.current = null
    originalVideoTrackRef.current = null
    sessionStorage.removeItem(SESSION_KEY)
  }, [])

  const connectToAgora = useCallback(
    async (stream: StreamResponse): Promise<void> => {
      const client = clientRef.current
      if (!client || !currentUserId) return

      const appId = (AGORA_DIRECT_FRONTEND_MODE ? AGORA_FRONTEND_APP_ID : stream.appId)?.trim()
      const token = AGORA_DIRECT_FRONTEND_MODE ? null : stream.token ?? null
      const joinUid = AGORA_DIRECT_FRONTEND_MODE ? null : stream.agoraUid

      if (!appId) {
        setAgoraError('No Agora App ID is available for the stream connection.')
        return
      }

      if (!AGORA_DIRECT_FRONTEND_MODE && !token) {
        setAgoraError('No Agora token received from server. Check your Agora credentials in application.yml.')
        return
      }

      if (client.connectionState !== 'DISCONNECTED') {
        console.info('[stream] Already connected to Agora channel')
        return
      }

      setIsConnecting(true)
      setAgoraError(null)

      try {
        const isRoomOwner = stream.isStreamHost

        console.info(
          '[stream] Joining Agora - appId=%s channel=%s uid=%s role=%s token=%s',
          appId,
          stream.channelName,
          joinUid ?? 'auto',
          isRoomOwner ? 'room-owner' : 'participant',
          token ? token.slice(0, 20) : '<none>',
        )

        await client.setClientRole('host')
        await client.join(appId, stream.channelName, token, joinUid)

        const audioTrack = await createOptionalMicrophoneTrack()
        const videoTrack = await createOptionalCameraTrack()
        const tracksToPublish = [audioTrack, videoTrack].filter(Boolean) as Array<ILocalAudioTrack | ILocalVideoTrack>

        localAudioTrackRef.current = audioTrack
        localVideoTrackRef.current = videoTrack
        setLocalAudioTrack(audioTrack)
        setLocalVideoTrack(videoTrack)
        setIsMuted(!audioTrack)
        setIsVideoOff(!videoTrack)

        if (tracksToPublish.length > 0) {
          await client.publish(tracksToPublish)
        }

        sessionStorage.setItem(SESSION_KEY, stream.streamId)
        console.info('[stream] Agora connected successfully as %s uid=%s', isRoomOwner ? 'room-owner' : 'participant', joinUid ?? 'auto')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to connect to Agora'
        console.error('[stream] Agora join failed:', err)
        setAgoraError(message)
      } finally {
        setIsConnecting(false)
      }
    },
    [createOptionalCameraTrack, createOptionalMicrophoneTrack, currentUserId],
  )

  const startLiveStream = useCallback(
    async (title: string, description: string) => {
      setError(null)
      try {
        const stream = await startStream({ title, description })
        streamIdRef.current = stream.streamId
        setStreamInfo(stream)
        setIsHost(true)
        setIsStreaming(true)
        sessionStorage.setItem(SESSION_KEY, stream.streamId)
        void connectToAgora(stream)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to start stream'
        console.error('[stream] startLiveStream error:', err)
        setError(message)
        throw err
      }
    },
    [connectToAgora],
  )

  const joinLiveStream = useCallback(
    async (streamId: string) => {
      setError(null)
      try {
        const stream = await joinStream(streamId)
        streamIdRef.current = stream.streamId
        setStreamInfo(stream)
        setIsHost(stream.isStreamHost)
        setIsStreaming(true)
        sessionStorage.setItem(SESSION_KEY, stream.streamId)
        void connectToAgora(stream)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to join stream'
        console.error('[stream] joinLiveStream error:', err)
        setError(message)
        throw err
      }
    },
    [connectToAgora],
  )

  const refreshStreamInfo = useCallback(async (): Promise<StreamResponse | null> => {
    const currentStreamId = streamIdRef.current
    if (!currentStreamId) {
      return null
    }

    try {
      const active = await getActiveStream()
      if (!active || active.streamId !== currentStreamId) {
        return null
      }

      setStreamInfo((prev) => {
        if (!prev) {
          return active
        }

        return {
          ...active,
          token: prev.token,
          appId: prev.appId ?? active.appId,
          agoraUid: prev.agoraUid || active.agoraUid,
          isStreamHost: prev.isStreamHost,
        }
      })

      return active
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    joinLiveStreamRef.current = joinLiveStream
  }, [joinLiveStream])

  useEffect(() => {
    const savedStreamId = sessionStorage.getItem(SESSION_KEY)
    if (!savedStreamId || !currentUserId) return

    let cancelled = false
    setIsRestoring(true)

    void (async () => {
      try {
        const active = await getActiveStream()
        if (!cancelled && active && active.streamId === savedStreamId) {
          await joinLiveStreamRef.current?.(savedStreamId)
        } else if (!cancelled) {
          sessionStorage.removeItem(SESSION_KEY)
        }
      } catch {
        if (!cancelled) {
          sessionStorage.removeItem(SESSION_KEY)
        }
      } finally {
        if (!cancelled) {
          setIsRestoring(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [currentUserId])

  const endLiveStream = useCallback(async () => {
    const streamId = streamIdRef.current
    if (streamId) {
      try {
        await endStream(streamId)
      } catch {
        // best effort
      }
    }
    await cleanupTracks()
  }, [cleanupTracks])

  const leaveLiveStream = useCallback(async () => {
    const streamId = streamIdRef.current
    if (streamId) {
      try {
        await leaveStream(streamId)
      } catch {
        // best effort
      }
    }
    await cleanupTracks()
  }, [cleanupTracks])

  const toggleMute = useCallback(async () => {
    const client = clientRef.current
    if (!client || client.connectionState === 'DISCONNECTED') return

    try {
      setAgoraError(null)
      const currentLocalAudioTrack = localAudioTrackRef.current

      if (!currentLocalAudioTrack) {
        const track = await createOptionalMicrophoneTrack()
        if (!track) {
          setIsMuted(true)
          return
        }

        await client.publish(track)
        localAudioTrackRef.current = track
        setLocalAudioTrack(track)
        setIsMuted(false)
        return
      }

      await currentLocalAudioTrack.setEnabled(isMuted)
      setIsMuted((prev) => !prev)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle microphone'
      console.error('[stream] microphone toggle error:', err)
      setAgoraError(message)
    }
  }, [createOptionalMicrophoneTrack, isMuted])

  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOff((prev) => !prev)
  }, [])

  const toggleVideo = useCallback(async () => {
    const client = clientRef.current
    if (!client || client.connectionState === 'DISCONNECTED') return

    if (isSharingScreen) {
      setAgoraError('Stop screen sharing before turning the camera back on.')
      return
    }

    try {
      setAgoraError(null)
      const currentLocalVideoTrack = localVideoTrackRef.current

      if (!currentLocalVideoTrack) {
        const track = await createOptionalCameraTrack()
        if (!track) {
          setIsVideoOff(true)
          return
        }

        await client.publish(track)
        localVideoTrackRef.current = track
        setLocalVideoTrack(track)
        setIsVideoOff(false)
        return
      }

      await currentLocalVideoTrack.setEnabled(isVideoOff)
      setIsVideoOff((prev) => !prev)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle camera'
      console.error('[stream] camera toggle error:', err)
      setAgoraError(message)
    }
  }, [createOptionalCameraTrack, isSharingScreen, isVideoOff])

  const stopScreenShare = useCallback(async () => {
    const client = clientRef.current
    if (!client || !screenTrackRef.current) return

    await client.unpublish(screenTrackRef.current)
    screenTrackRef.current.stop()
    screenTrackRef.current.close()
    screenTrackRef.current = null

    const originalVideoTrack = originalVideoTrackRef.current
    originalVideoTrackRef.current = null

    if (originalVideoTrack) {
      await client.publish(originalVideoTrack)
      localVideoTrackRef.current = originalVideoTrack
      setLocalVideoTrack(originalVideoTrack)
      setIsVideoOff(false)
    } else {
      localVideoTrackRef.current = null
      setLocalVideoTrack(null)
      setIsVideoOff(true)
    }

    setIsSharingScreen(false)
  }, [])

  const toggleScreenShare = useCallback(async () => {
    const client = clientRef.current
    if (!client || client.connectionState === 'DISCONNECTED') return

    try {
      setAgoraError(null)

      if (isSharingScreen) {
        await stopScreenShare()
      } else {
        const screenTrack = await AgoraRTC.createScreenVideoTrack(
          { encoderConfig: AGORA_CONFIG.screenEncoderConfig },
          'auto',
        )
        const track = Array.isArray(screenTrack) ? screenTrack[0] : screenTrack

        originalVideoTrackRef.current = localVideoTrackRef.current
        if (localVideoTrackRef.current) {
          await client.unpublish(localVideoTrackRef.current)
        }

        await client.publish(track)
        screenTrackRef.current = track
        localVideoTrackRef.current = track
        setLocalVideoTrack(track)
        setIsSharingScreen(true)
        setIsVideoOff(false)
        track.on('track-ended', () => {
          void stopScreenShare()
        })
      }
    } catch (err) {
      console.error('[stream] screen share error:', err)
      setAgoraError(err instanceof Error ? err.message : 'Failed to share your screen')
    }
  }, [isSharingScreen, stopScreenShare])

  useEffect(() => {
    return () => {
      void cleanupTracks()
    }
  }, [cleanupTracks])

  return {
    isStreaming,
    isHost,
    streamInfo,
    localVideoTrack,
    localAudioTrack,
    remoteUsers,
    isMuted,
    isSpeakerOff,
    isVideoOff,
    isSharingScreen,
    isConnecting,
    agoraError,
    isRestoring,
    startLiveStream,
    joinLiveStream,
    refreshStreamInfo,
    endLiveStream,
    leaveLiveStream,
    toggleMute,
    toggleSpeaker,
    toggleVideo,
    toggleScreenShare,
    error,
  }
}
