import { useCallback, useEffect, useRef, useState } from 'react'

import type { VideoCallSignal, VideoCallSignalResponse } from '../types'

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

export type CallStatus = 'idle' | 'calling' | 'incoming' | 'connected'

interface UseVideoCallOptions {
  currentUserId: string | null
  sendVideoSignal: (signal: VideoCallSignal) => boolean
}

interface UseVideoCallReturn {
  callStatus: CallStatus
  remoteUserId: string | null
  remoteUserName: string | null
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  isMuted: boolean
  isVideoOff: boolean
  startCall: (targetUserId: string) => Promise<void>
  acceptCall: () => Promise<void>
  rejectCall: () => void
  endCall: () => void
  toggleMute: () => void
  toggleVideo: () => void
  handleIncomingSignal: (signal: VideoCallSignalResponse) => void
}

export const useVideoCall = ({
  currentUserId,
  sendVideoSignal,
}: UseVideoCallOptions): UseVideoCallReturn => {
  const [callStatus, setCallStatus] = useState<CallStatus>('idle')
  const [remoteUserId, setRemoteUserId] = useState<string | null>(null)
  const [remoteUserName, setRemoteUserName] = useState<string | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([])
  const remoteUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    remoteUserIdRef.current = remoteUserId
  }, [remoteUserId])

  const cleanup = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop())
    }

    setLocalStream(null)
    setRemoteStream(null)
    setCallStatus('idle')
    setRemoteUserId(null)
    setRemoteUserName(null)
    setIsMuted(false)
    setIsVideoOff(false)
    pendingCandidatesRef.current = []
  }, [localStream])

  const getLocalMedia = useCallback(async (): Promise<MediaStream> => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    })
    setLocalStream(stream)
    return stream
  }, [])

  const createPeerConnection = useCallback(
    (stream: MediaStream, targetUserId: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection(ICE_SERVERS)

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream)
      })

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendVideoSignal({
            targetUserId,
            type: 'ice-candidate',
            candidate: event.candidate.candidate,
            sdpMLineIndex: event.candidate.sdpMLineIndex ?? undefined,
            sdpMid: event.candidate.sdpMid ?? undefined,
          })
        }
      }

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0] ?? null)
      }

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          cleanup()
        }
      }

      peerConnectionRef.current = pc
      return pc
    },
    [cleanup, sendVideoSignal],
  )

  const startCall = useCallback(
    async (targetUserId: string) => {
      if (!currentUserId || callStatus !== 'idle') return

      setRemoteUserId(targetUserId)
      setCallStatus('calling')

      try {
        const stream = await getLocalMedia()
        const pc = createPeerConnection(stream, targetUserId)

        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)

        sendVideoSignal({
          targetUserId,
          type: 'call-offer',
          sdp: offer.sdp,
        })
      } catch {
        cleanup()
      }
    },
    [callStatus, cleanup, createPeerConnection, currentUserId, getLocalMedia, sendVideoSignal],
  )

  const acceptCall = useCallback(async () => {
    const targetId = remoteUserIdRef.current
    if (!targetId || callStatus !== 'incoming') return

    try {
      const stream = await getLocalMedia()
      const pc = peerConnectionRef.current

      if (!pc) return

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream)
      })

      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      sendVideoSignal({
        targetUserId: targetId,
        type: 'call-answer',
        sdp: answer.sdp,
      })

      // Process any pending ICE candidates
      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate))
      }
      pendingCandidatesRef.current = []

      setCallStatus('connected')
    } catch {
      cleanup()
    }
  }, [callStatus, cleanup, getLocalMedia, sendVideoSignal])

  const rejectCall = useCallback(() => {
    const targetId = remoteUserIdRef.current
    if (targetId) {
      sendVideoSignal({
        targetUserId: targetId,
        type: 'call-reject',
      })
    }
    cleanup()
  }, [cleanup, sendVideoSignal])

  const endCall = useCallback(() => {
    const targetId = remoteUserIdRef.current
    if (targetId) {
      sendVideoSignal({
        targetUserId: targetId,
        type: 'call-end',
      })
    }
    cleanup()
  }, [cleanup, sendVideoSignal])

  const toggleMute = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsMuted((prev) => !prev)
    }
  }, [localStream])

  const toggleVideo = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsVideoOff((prev) => !prev)
    }
  }, [localStream])

  const handleIncomingSignal = useCallback(
    (signal: VideoCallSignalResponse) => {
      switch (signal.type) {
        case 'call-offer': {
          if (callStatus !== 'idle') {
            // Already in a call, auto-reject
            sendVideoSignal({
              targetUserId: signal.fromUserId,
              type: 'call-reject',
            })
            return
          }

          setRemoteUserId(signal.fromUserId)
          setRemoteUserName(signal.fromUserName)
          setCallStatus('incoming')

          // Create peer connection to hold remote description
          const pc = new RTCPeerConnection(ICE_SERVERS)

          pc.onicecandidate = (event) => {
            if (event.candidate) {
              sendVideoSignal({
                targetUserId: signal.fromUserId,
                type: 'ice-candidate',
                candidate: event.candidate.candidate,
                sdpMLineIndex: event.candidate.sdpMLineIndex ?? undefined,
                sdpMid: event.candidate.sdpMid ?? undefined,
              })
            }
          }

          pc.ontrack = (event) => {
            setRemoteStream(event.streams[0] ?? null)
          }

          pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
              cleanup()
            }
          }

          peerConnectionRef.current = pc

          if (signal.sdp) {
            void pc.setRemoteDescription(
              new RTCSessionDescription({ type: 'offer', sdp: signal.sdp }),
            )
          }
          break
        }

        case 'call-answer': {
          const pc = peerConnectionRef.current
          if (pc && signal.sdp) {
            void pc
              .setRemoteDescription(
                new RTCSessionDescription({ type: 'answer', sdp: signal.sdp }),
              )
              .then(async () => {
                // Process any pending ICE candidates
                for (const candidate of pendingCandidatesRef.current) {
                  await pc.addIceCandidate(new RTCIceCandidate(candidate))
                }
                pendingCandidatesRef.current = []
              })
            setCallStatus('connected')
          }
          break
        }

        case 'ice-candidate': {
          const pc = peerConnectionRef.current
          if (pc && signal.candidate) {
            const candidateInit: RTCIceCandidateInit = {
              candidate: signal.candidate,
              sdpMLineIndex: signal.sdpMLineIndex,
              sdpMid: signal.sdpMid,
            }

            if (pc.remoteDescription) {
              void pc.addIceCandidate(new RTCIceCandidate(candidateInit))
            } else {
              pendingCandidatesRef.current.push(candidateInit)
            }
          }
          break
        }

        case 'call-end':
        case 'call-reject': {
          cleanup()
          break
        }
      }
    },
    [callStatus, cleanup, sendVideoSignal],
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
      }
    }
  }, [])

  return {
    callStatus,
    remoteUserId,
    remoteUserName,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    handleIncomingSignal,
  }
}
