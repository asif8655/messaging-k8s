import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ILocalAudioTrack,
  ILocalVideoTrack,
} from 'agora-rtc-sdk-ng'
import { useCallback, useEffect, useRef, useState } from 'react'

import { generateRtcToken, getAgoraAppId } from '../api/rtcApi'
import {
  AGORA_DIRECT_FRONTEND_MODE,
  AGORA_FRONTEND_APP_ID,
  AGORA_CONFIG,
  AgoraRTC,
  createAgoraClient,
} from '../config/agoraConfig'
import type { AgoraCallType, CallEventRequest, CallEventResponse, RtcTokenResponse } from '../types'

export type AgoraCallStatus = 'idle' | 'calling' | 'incoming' | 'connecting' | 'connected'

interface UseAgoraCallOptions {
  currentUserId: string | null
  sendCallEvent: (event: CallEventRequest) => boolean
}

interface UseAgoraCallReturn {
  callStatus: AgoraCallStatus
  callType: AgoraCallType
  callError: string | null
  remoteUserId: string | null
  remoteUserName: string | null
  localVideoTrack: ILocalVideoTrack | null
  localAudioTrack: ILocalAudioTrack | null
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
  handleIncomingCall: (fromUserId: string, fromUserName: string, channelName: string) => void
  handleCallAccepted: (event?: CallEventResponse) => void
  handleCallRejected: (event?: CallEventResponse) => void
  handleCallEnded: (event?: CallEventResponse) => void
}

const getCallTypeFromChannelName = (channelName: string): AgoraCallType =>
  channelName.startsWith('audio_call_') ? 'audio' : 'video'

const sanitizeAgoraAppId = (value: string): string =>
  value.trim().replace(/^['"]+|['"]+$/g, '')

const isValidAgoraAppId = (value: string): boolean => /^[A-Za-z0-9]{32}$/.test(value)

const isDeviceNotFoundError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error)
  return message.includes('DEVICE_NOT_FOUND') || message.includes('Requested device not found')
}

const isMicrophoneAccessError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error)
  return (
    message.includes('PERMISSION_DENIED') ||
    message.includes('NotAllowedError') ||
    message.includes('Permission denied') ||
    isDeviceNotFoundError(error)
  )
}

const normalizeAgoraUid = (uid: number | string): number | string => {
  if (typeof uid === 'number') {
    return uid
  }

  const trimmedUid = uid.trim()
  if (/^\d+$/.test(trimmedUid)) {
    return Number(trimmedUid)
  }

  return trimmedUid
}

const toChannelSafeId = (value: string): string =>
  value.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 8)

const buildCallChannelName = (
  currentUserId: string,
  targetUserId: string,
  callType: AgoraCallType,
): string => {
  const prefix = callType === 'audio' ? 'a' : 'v'
  const timestamp = Date.now().toString(36)
  return `${prefix}_${timestamp}_${toChannelSafeId(currentUserId)}_${toChannelSafeId(targetUserId)}`
}

const isMatchingCallEvent = (
  event: CallEventResponse | undefined,
  expectedRemoteUserId: string | null,
): boolean => {
  if (!event || !expectedRemoteUserId) {
    return true
  }

  return event.fromUserId === expectedRemoteUserId
}

export const useAgoraCall = ({
  currentUserId,
  sendCallEvent,
}: UseAgoraCallOptions): UseAgoraCallReturn => {
  const [callStatus, setCallStatus] = useState<AgoraCallStatus>('idle')
  const [callType, setCallType] = useState<AgoraCallType>('video')
  const [callError, setCallError] = useState<string | null>(null)
  const [remoteUserId, setRemoteUserId] = useState<string | null>(null)
  const [remoteUserName, setRemoteUserName] = useState<string | null>(null)
  const [localVideoTrack, setLocalVideoTrack] = useState<ILocalVideoTrack | null>(null)
  const [localAudioTrack, setLocalAudioTrack] = useState<ILocalAudioTrack | null>(null)
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOff, setIsSpeakerOff] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isSharingScreen, setIsSharingScreen] = useState(false)

  const clientRef = useRef<IAgoraRTCClient | null>(null)
  const channelNameRef = useRef<string | null>(null)
  const screenTrackRef = useRef<ILocalVideoTrack | null>(null)
  const originalVideoTrackRef = useRef<ILocalVideoTrack | null>(null)
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
      if (isDeviceNotFoundError(error)) {
        console.warn('[call] camera not available, continuing without video')
        setCallError('Camera not found. Continuing with audio only.')
        return null
      }

      throw error
    }
  }, [])

  const createOptionalMicrophoneTrack = useCallback(async () => {
    try {
      return await AgoraRTC.createMicrophoneAudioTrack()
    } catch (error) {
      if (isMicrophoneAccessError(error)) {
        console.warn('[call] microphone not available, continuing in listen-only mode')
        setCallError('Microphone not available. You joined in listen-only mode.')
        return null
      }

      throw error
    }
  }, [])

  const isSpeakerOffRef = useRef(isSpeakerOff)

  useEffect(() => {
    isSpeakerOffRef.current = isSpeakerOff
  }, [isSpeakerOff])

  // Initialize Agora client
  useEffect(() => {
    const client = createAgoraClient()
    clientRef.current = client

    // Handle remote user published
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

    // Handle remote user unpublished
    client.on('user-unpublished', (user, mediaType) => {
      if (mediaType === 'audio') {
        user.audioTrack?.stop()
      }

      syncRemoteUser(user)
    })

    // Handle user left
    client.on('user-left', (user) => {
      setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid))
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

  const cleanup = useCallback(async (options?: { preserveError?: boolean }) => {
    const client = clientRef.current
    const currentLocalAudioTrack = localAudioTrackRef.current
    const currentLocalVideoTrack = localVideoTrackRef.current
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

    if (currentLocalAudioTrack) {
      currentLocalAudioTrack.stop()
      currentLocalAudioTrack.close()
      localAudioTrackRef.current = null
      setLocalAudioTrack(null)
    }

    if (currentLocalVideoTrack) {
      currentLocalVideoTrack.stop()
      currentLocalVideoTrack.close()
      localVideoTrackRef.current = null
      setLocalVideoTrack(null)
    }

    if (screenTrackRef.current) {
      screenTrackRef.current.stop()
      screenTrackRef.current.close()
      screenTrackRef.current = null
    }

    if (originalVideoTrack && originalVideoTrack !== currentLocalVideoTrack) {
      originalVideoTrack.stop()
      originalVideoTrack.close()
    }
    originalVideoTrackRef.current = null

    if (client && client.connectionState !== 'DISCONNECTED') {
      await client.leave()
    }

    setRemoteUsers([])
    setCallStatus('idle')
    setCallType('video')
    if (!options?.preserveError) {
      setCallError(null)
    }
    setRemoteUserId(null)
    setRemoteUserName(null)
    setIsMuted(false)
    setIsSpeakerOff(false)
    setIsVideoOff(false)
    setIsSharingScreen(false)
    channelNameRef.current = null
  }, [])

  const joinChannel = useCallback(
    async (channelName: string, targetUserId: string, videoEnabled: boolean): Promise<void> => {
      const client = clientRef.current
      if (!client || !currentUserId) return

      try {
        setCallStatus('connecting')

        let appId = ''
        let joinChannelName = channelName.trim()
        let joinToken: string | null = null
        let normalizedUid: number | string | null = null

        if (AGORA_DIRECT_FRONTEND_MODE) {
          appId = sanitizeAgoraAppId(AGORA_FRONTEND_APP_ID)
          console.info('[call] using direct frontend Agora mode', {
            appId,
            channelName: joinChannelName,
          })
        } else {
          const tokenData: RtcTokenResponse = await generateRtcToken({
            channelName,
            targetUserId,
            role: 1, // Publisher
          })

          appId = sanitizeAgoraAppId(tokenData.appId || await getAgoraAppId())
          joinChannelName = (tokenData.channelName || channelName).trim()
          joinToken = tokenData.token.trim()
          normalizedUid = normalizeAgoraUid(tokenData.uid)

          console.info('[call] rtc token response', {
            appId,
            appIdLength: appId.length,
            channelName: joinChannelName,
            uid: normalizedUid,
            tokenPrefix: joinToken.slice(0, 20),
          })
        }

        if (!appId) {
          throw new Error('Agora App ID is missing in the RTC token response.')
        }

        if (!isValidAgoraAppId(appId)) {
          throw new Error(`Invalid Agora App ID format received: "${appId}"`)
        }

        if (!AGORA_DIRECT_FRONTEND_MODE && !joinToken) {
          throw new Error('Agora RTC token is missing in the RTC token response.')
        }

        // Join first so device issues do not tear down the whole call UI.
        await client.join(appId, joinChannelName, joinToken, normalizedUid)

        // Create local tracks after join and publish only what is available.
        const audioTrack = await createOptionalMicrophoneTrack()
        const videoTrack = videoEnabled ? await createOptionalCameraTrack() : null
        const resolvedVideoEnabled = Boolean(videoTrack)
        const tracksToPublish = [audioTrack, videoTrack].filter(Boolean) as Array<ILocalAudioTrack | ILocalVideoTrack>

        localAudioTrackRef.current = audioTrack
        localVideoTrackRef.current = videoTrack
        setLocalAudioTrack(audioTrack)
        setLocalVideoTrack(videoTrack)

        console.info('[call] joining Agora', {
          appId,
          channelName: joinChannelName,
          uid: normalizedUid,
          videoEnabled: resolvedVideoEnabled,
          directMode: AGORA_DIRECT_FRONTEND_MODE,
        })

        if (tracksToPublish.length > 0) {
          await client.publish(tracksToPublish)
        }

        channelNameRef.current = joinChannelName
        setIsMuted(!audioTrack)
        setIsVideoOff(!resolvedVideoEnabled)
        if ((audioTrack && (resolvedVideoEnabled || !videoEnabled)) || (!audioTrack && !videoEnabled)) {
          setCallError(null)
        }
        setCallStatus('connected')
      } catch (error) {
        console.error('Failed to join channel:', error)
        await cleanup({ preserveError: true })
        setCallError(error instanceof Error ? error.message : 'Failed to connect to Agora')
        throw error
      }
    },
    [cleanup, createOptionalCameraTrack, createOptionalMicrophoneTrack, currentUserId],
  )

  const startCall = useCallback(
    async (targetUserId: string, targetUserName: string, videoEnabled: boolean = true) => {
      if (!currentUserId || callStatus !== 'idle') return

      const nextCallType: AgoraCallType = videoEnabled ? 'video' : 'audio'
      const channelName = buildCallChannelName(currentUserId, targetUserId, nextCallType)
      
      setRemoteUserId(targetUserId)
      setRemoteUserName(targetUserName)
      setCallType(nextCallType)
      setCallError(null)
      setCallStatus('calling')

      try {
        // Send call start event via WebSocket
        sendCallEvent({
          targetUserId,
          eventType: 'call-start',
          channelName,
        })

        // Join the channel immediately (caller creates the room)
        await joinChannel(channelName, targetUserId, videoEnabled)
      } catch (error) {
        console.error('Failed to start call:', error)
      }
    },
    [callStatus, currentUserId, joinChannel, sendCallEvent],
  )

  const acceptCall = useCallback(async () => {
    const channelName = channelNameRef.current
    const targetId = remoteUserId

    if (!channelName || !targetId || callStatus !== 'incoming') return

    try {
      // Send call accept event
      sendCallEvent({
        targetUserId: targetId,
        eventType: 'call-accept',
        channelName,
      })

      // Join the channel
      await joinChannel(channelName, targetId, callType === 'video')
    } catch (error) {
      console.error('Failed to accept call:', error)
    }
  }, [callStatus, callType, joinChannel, remoteUserId, sendCallEvent])

  const rejectCall = useCallback(() => {
    const targetId = remoteUserId
    if (targetId) {
      sendCallEvent({
        targetUserId: targetId,
        eventType: 'call-reject',
      })
    }
    void cleanup()
  }, [cleanup, remoteUserId, sendCallEvent])

  const endCall = useCallback(() => {
    const targetId = remoteUserId
    if (targetId) {
      sendCallEvent({
        targetUserId: targetId,
        eventType: 'call-end',
      })
    }
    void cleanup()
  }, [cleanup, remoteUserId, sendCallEvent])

  const toggleMute = useCallback(async () => {
    const client = clientRef.current
    if (!client || client.connectionState === 'DISCONNECTED') return

    try {
      setCallError(null)
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
      setIsMuted(!isMuted)
    } catch (error) {
      console.error('Failed to toggle microphone:', error)
      setCallError(error instanceof Error ? error.message : 'Failed to toggle microphone')
    }
  }, [createOptionalMicrophoneTrack, isMuted])

  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOff((prev) => !prev)
  }, [])

  const toggleVideo = useCallback(async () => {
    const client = clientRef.current
    if (!client || client.connectionState === 'DISCONNECTED') return

    if (isSharingScreen) {
      setCallError('Stop screen sharing before turning the camera back on.')
      return
    }

    try {
      setCallError(null)
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
      setIsVideoOff(!isVideoOff)
    } catch (error) {
      console.error('Failed to toggle video:', error)
      setCallError(error instanceof Error ? error.message : 'Failed to toggle camera')
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
      setCallError(null)

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
    } catch (error) {
      console.error('Failed to toggle screen share:', error)
      setCallError(error instanceof Error ? error.message : 'Failed to share your screen')
    }
  }, [isSharingScreen, stopScreenShare])

  const handleIncomingCall = useCallback(
    (fromUserId: string, fromUserName: string, channelName: string) => {
      if (callStatus !== 'idle') {
        // Already in a call, auto-reject
        sendCallEvent({
          targetUserId: fromUserId,
          eventType: 'call-reject',
        })
        return
      }

      setRemoteUserId(fromUserId)
      setRemoteUserName(fromUserName)
      setCallType(getCallTypeFromChannelName(channelName))
      setCallError(null)
      setIsVideoOff(getCallTypeFromChannelName(channelName) === 'audio')
      channelNameRef.current = channelName
      setCallStatus('incoming')
    },
    [callStatus, sendCallEvent],
  )

  const handleCallAccepted = useCallback(
    async (event?: CallEventResponse) => {
      console.info('[call] received call-accept event', event)
      if (callStatus === 'calling') {
        if (event?.channelName) {
          setCallType(getCallTypeFromChannelName(event.channelName))
        }
        setCallStatus('connected')
      }
    },
    [callStatus],
  )

  const handleCallRejected = useCallback((event?: CallEventResponse) => {
    console.info('[call] received call-reject event', event)
    if (!isMatchingCallEvent(event, remoteUserId)) {
      console.info('[call] ignoring call-reject event for different remote user', event)
      return
    }
    void cleanup()
  }, [cleanup, remoteUserId])

  const handleCallEnded = useCallback((event?: CallEventResponse) => {
    console.info('[call] received call-end event', event)
    if (!isMatchingCallEvent(event, remoteUserId)) {
      console.info('[call] ignoring call-end event for different remote user', event)
      return
    }
    void cleanup()
  }, [cleanup, remoteUserId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      void cleanup()
    }
  }, [cleanup])

  return {
    callStatus,
    callType,
    callError,
    remoteUserId,
    remoteUserName,
    localVideoTrack,
    localAudioTrack,
    remoteUsers,
    isMuted,
    isSpeakerOff,
    isVideoOff,
    isSharingScreen,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleSpeaker,
    toggleVideo,
    toggleScreenShare,
    handleIncomingCall,
    handleCallAccepted,
    handleCallRejected,
    handleCallEnded,
  }
}
