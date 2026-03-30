import { Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react'
import { useEffect, useRef } from 'react'

import type { CallStatus } from '../../hooks/useVideoCall'

interface VideoCallModalProps {
  callStatus: CallStatus
  remoteUserName: string | null
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  isMuted: boolean
  isVideoOff: boolean
  onEndCall: () => void
  onToggleMute: () => void
  onToggleVideo: () => void
}

export const VideoCallModal = ({
  callStatus,
  remoteUserName,
  localStream,
  remoteStream,
  isMuted,
  isVideoOff,
  onEndCall,
  onToggleMute,
  onToggleVideo,
}: VideoCallModalProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  if (callStatus === 'idle' || callStatus === 'incoming') {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative flex h-full w-full max-w-5xl flex-col items-center justify-center p-4 sm:p-8">
        {/* Status indicator */}
        <div className="absolute left-1/2 top-6 z-10 -translate-x-1/2">
          <div className="rounded-full bg-black/50 px-5 py-2 text-sm font-medium text-white backdrop-blur">
            {callStatus === 'calling' && (
              <span className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                Calling {remoteUserName ?? 'user'}...
              </span>
            )}
            {callStatus === 'connected' && (
              <span className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                Connected with {remoteUserName ?? 'user'}
              </span>
            )}
          </div>
        </div>

        {/* Remote video (large) */}
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-3xl bg-slate-900">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-4 text-white/60">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-4xl font-bold uppercase">
                {remoteUserName?.[0] ?? '?'}
              </div>
              <p className="text-lg font-medium">{remoteUserName ?? 'Waiting...'}</p>
              {callStatus === 'calling' && (
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-white/40 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-white/40 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-white/40 [animation-delay:300ms]" />
                </div>
              )}
            </div>
          )}

          {/* Local video (pip) */}
          <div className="absolute bottom-4 right-4 h-36 w-48 overflow-hidden rounded-2xl border-2 border-white/20 bg-slate-800 shadow-2xl sm:h-44 sm:w-60">
            {localStream && !isVideoOff ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-white/40">
                <VideoOff className="h-8 w-8" />
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 flex items-center gap-4">
          <button
            type="button"
            onClick={onToggleMute}
            className={`flex h-14 w-14 items-center justify-center rounded-full transition ${
              isMuted
                ? 'bg-red-500/90 text-white hover:bg-red-500'
                : 'bg-white/15 text-white hover:bg-white/25'
            }`}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </button>

          <button
            type="button"
            onClick={onToggleVideo}
            className={`flex h-14 w-14 items-center justify-center rounded-full transition ${
              isVideoOff
                ? 'bg-red-500/90 text-white hover:bg-red-500'
                : 'bg-white/15 text-white hover:bg-white/25'
            }`}
            aria-label={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
          </button>

          <button
            type="button"
            onClick={onEndCall}
            className="flex h-14 w-20 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-700"
            aria-label="End call"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  )
}
