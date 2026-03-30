import {
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  Volume2,
  VolumeX,
  Video,
  VideoOff,
} from 'lucide-react'
import { useEffect, useRef } from 'react'

import type { AgoraCallStatus } from '../../hooks/useAgoraCall'
import { isScreenShareSupported } from '../../config/agoraConfig'
import type { IAgoraRTCRemoteUser, ILocalVideoTrack } from 'agora-rtc-sdk-ng'
import type { AgoraCallType } from '../../types'

interface AgoraVideoCallScreenProps {
  callStatus: AgoraCallStatus
  callType: AgoraCallType
  callError: string | null
  remoteUserName: string | null
  localVideoTrack: ILocalVideoTrack | null
  remoteUsers: IAgoraRTCRemoteUser[]
  isMuted: boolean
  isSpeakerOff: boolean
  isVideoOff: boolean
  isSharingScreen: boolean
  onToggleMute: () => void
  onToggleSpeaker: () => void
  onToggleVideo: () => void
  onToggleScreenShare: () => void
  onEndCall: () => void
}

export const AgoraVideoCallScreen = ({
  callStatus,
  callType,
  callError,
  remoteUserName,
  localVideoTrack,
  remoteUsers,
  isMuted,
  isSpeakerOff,
  isVideoOff,
  isSharingScreen,
  onToggleMute,
  onToggleSpeaker,
  onToggleVideo,
  onToggleScreenShare,
  onEndCall,
}: AgoraVideoCallScreenProps) => {
  const localVideoRef = useRef<HTMLDivElement>(null)
  const remoteVideoRefs = useRef<Map<string | number, HTMLDivElement>>(new Map())
  const screenShareSupported = isScreenShareSupported()

  // Play local video track
  useEffect(() => {
    if (localVideoTrack && localVideoRef.current && !isVideoOff) {
      localVideoTrack.play(localVideoRef.current)
    }
  }, [localVideoTrack, isVideoOff])

  // Play remote video tracks
  useEffect(() => {
    remoteUsers.forEach((user) => {
      if (user.videoTrack) {
        const container = remoteVideoRefs.current.get(user.uid)
        if (container) {
          user.videoTrack.play(container)
        }
      }
    })
  }, [remoteUsers])

  if (callStatus !== 'connected' && callStatus !== 'connecting' && !callError) {
    return null
  }

  const remoteUser = remoteUsers[0]

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900">
      <div className="relative flex-1">
        {remoteUser?.videoTrack ? (
          <div
            ref={(el) => {
              if (el) remoteVideoRefs.current.set(remoteUser.uid, el)
            }}
            className="h-full w-full"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-800">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-slate-700">
                <Video className="h-12 w-12 text-slate-400" />
              </div>
              <p className="text-lg font-medium text-white">
                {remoteUserName || 'Remote User'}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {callError
                  ? 'Unable to connect'
                  : callStatus === 'connecting'
                  ? 'Connecting...'
                  : callType === 'audio'
                    ? 'Audio call in progress'
                    : 'Camera is off'}
              </p>
              {callError ? (
                <p className="mt-3 max-w-sm text-sm text-red-400">{callError}</p>
              ) : null}
            </div>
          </div>
        )}

        <div className="absolute bottom-24 right-3 h-28 w-24 overflow-hidden rounded-2xl border-2 border-white/20 bg-slate-800 shadow-2xl sm:bottom-6 sm:right-6 sm:h-40 sm:w-56">
          {localVideoTrack && !isVideoOff ? (
            <div ref={localVideoRef} className="h-full w-full" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <VideoOff className="h-8 w-8 text-slate-400" />
            </div>
          )}
          {isSharingScreen && (
            <div className="absolute bottom-2 left-2 rounded-full bg-blue-500 px-2 py-1 text-[10px] font-medium text-white sm:text-xs">
              Sharing Screen
            </div>
          )}
        </div>

        <div className="absolute left-3 top-3 max-w-[calc(100%-7rem)] rounded-2xl bg-black/40 px-3 py-2 backdrop-blur-sm sm:left-6 sm:top-6 sm:max-w-none sm:px-4 sm:py-3">
          <p className="text-sm font-medium text-white">{remoteUserName || 'Unknown'}</p>
          <p className="mt-0.5 text-xs text-slate-300">
            {callError ? 'Connection failed' : callStatus === 'connecting' ? 'Connecting...' : 'Connected'}
          </p>
        </div>
      </div>

      <div className="border-t border-white/10 bg-slate-900/95 px-3 py-4 backdrop-blur-sm sm:px-6 sm:py-6">
        <div className="mx-auto flex max-w-md items-center justify-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onToggleMute}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition sm:h-14 sm:w-14 ${
              isMuted
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </button>

          <button
            type="button"
            onClick={onToggleSpeaker}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition sm:h-14 sm:w-14 ${
              isSpeakerOff
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            aria-label={isSpeakerOff ? 'Turn speaker on' : 'Turn speaker off'}
          >
            {isSpeakerOff ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
          </button>

          <button
            type="button"
            onClick={onToggleVideo}
            disabled={callType === 'audio'}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition sm:h-14 sm:w-14 ${
              isVideoOff
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-white/10 text-white hover:bg-white/20'
            } ${callType === 'audio' ? 'cursor-not-allowed opacity-50' : ''}`}
            aria-label={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
          </button>

          <button
            type="button"
            onClick={onToggleScreenShare}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition sm:h-14 sm:w-14 ${
              isSharingScreen
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            aria-label={isSharingScreen ? 'Stop sharing' : 'Share screen'}
            title={
              screenShareSupported
                ? isSharingScreen
                  ? 'Stop sharing'
                  : 'Share screen'
                : 'Screen sharing is not supported in this mobile browser'
            }
          >
            {isSharingScreen ? (
              <MonitorOff className="h-6 w-6" />
            ) : (
              <Monitor className="h-6 w-6" />
            )}
          </button>

          <button
            type="button"
            onClick={onEndCall}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white transition hover:bg-red-600 sm:h-14 sm:w-14"
            aria-label="End call"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  )
}
