import {
  Maximize,
  Mic,
  MicOff,
  Minimize,
  Monitor,
  Users,
  Volume2,
  VolumeX,
  Video,
  VideoOff,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { IAgoraRTCRemoteUser, ILocalVideoTrack } from 'agora-rtc-sdk-ng'

import { isBrowserFullscreenSupported, isScreenShareSupported } from '../../config/agoraConfig'
import type { ViewerInfo } from '../../types'

interface LiveStreamScreenProps {
  isHost: boolean
  streamTitle: string
  hostName: string
  viewerCount: number
  viewers: ViewerInfo[]
  localVideoTrack: ILocalVideoTrack | null
  remoteUsers: IAgoraRTCRemoteUser[]
  isMuted: boolean
  isSpeakerOff: boolean
  isVideoOff: boolean
  isSharingScreen: boolean
  isConnecting: boolean
  agoraError: string | null
  onEndStream: () => void
  onLeaveStream: () => void
  onToggleMute: () => void
  onToggleSpeaker: () => void
  onToggleVideo: () => void
  onToggleScreenShare: () => void
}

interface ParticipantCard {
  id: string
  label: string
  subtitle: string
  isLocal: boolean
  hasVideo: boolean
  hasAudio: boolean
  isSharingScreen: boolean
  remoteUser?: IAgoraRTCRemoteUser
}

export const LiveStreamScreen = ({
  isHost,
  streamTitle,
  hostName,
  viewerCount,
  viewers,
  localVideoTrack,
  remoteUsers,
  isMuted,
  isSpeakerOff,
  isVideoOff,
  isSharingScreen,
  isConnecting,
  agoraError,
  onEndStream,
  onLeaveStream,
  onToggleMute,
  onToggleSpeaker,
  onToggleVideo,
  onToggleScreenShare,
}: LiveStreamScreenProps) => {
  const screenRef = useRef<HTMLDivElement>(null)
  const remoteVideoRefs = useRef<Map<string | number, HTMLDivElement>>(new Map())
  const chromeHideTimeoutRef = useRef<number | null>(null)
  const [showViewers, setShowViewers] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPseudoFullscreen, setIsPseudoFullscreen] = useState(false)
  const [showChrome, setShowChrome] = useState(true)
  const [focusedParticipantId, setFocusedParticipantId] = useState('local')
  const [localVideoContainer, setLocalVideoContainer] = useState<HTMLDivElement | null>(null)
  const browserFullscreenSupported = isBrowserFullscreenSupported()
  const screenShareSupported = isScreenShareSupported()
  const isImmersiveMode = isFullscreen || isPseudoFullscreen

  const participants: ParticipantCard[] = [
    {
      id: 'local',
      label: 'You',
      subtitle: isHost ? 'Host' : 'Participant',
      isLocal: true,
      hasVideo: Boolean(localVideoTrack),
      hasAudio: !isMuted,
      isSharingScreen,
    },
    ...remoteUsers.map((user, index) => ({
      id: String(user.uid),
      label: `Participant ${index + 1}`,
      subtitle: user.hasVideo ? 'Video on' : user.hasAudio ? 'Audio only' : 'Connected',
      isLocal: false,
      hasVideo: Boolean(user.videoTrack),
      hasAudio: Boolean(user.audioTrack || user.hasAudio),
      isSharingScreen: false,
      remoteUser: user,
    })),
  ]

  const remoteVideoVersion = useMemo(
    () =>
      remoteUsers
        .map((user) => `${user.uid}:${user.hasVideo ? 'v' : '-'}:${user.hasAudio ? 'a' : '-'}`)
        .join('|'),
    [remoteUsers],
  )

  const preferredParticipant =
    participants.find((participant) => participant.isLocal && participant.isSharingScreen) ??
    participants.find((participant) => !participant.isLocal && participant.hasVideo) ??
    participants.find((participant) => participant.isLocal && participant.hasVideo) ??
    participants.find((participant) => !participant.isLocal && participant.hasAudio) ??
    participants[0] ??
    null

  useEffect(() => {
    if (!preferredParticipant) {
      return
    }

    const focusedParticipant = participants.find((participant) => participant.id === focusedParticipantId)
    if (!focusedParticipant) {
      setFocusedParticipantId(preferredParticipant.id)
      return
    }

    if (preferredParticipant.id !== focusedParticipant.id && (
      (focusedParticipant.id === 'local' && !focusedParticipant.isSharingScreen) ||
      (!focusedParticipant.hasVideo && preferredParticipant.hasVideo)
    )) {
      setFocusedParticipantId(preferredParticipant.id)
    }
  }, [focusedParticipantId, participants, preferredParticipant])

  const focusedParticipant =
    participants.find((participant) => participant.id === focusedParticipantId) ??
    preferredParticipant

  const thumbnailParticipants = participants.filter((participant) => participant.id !== focusedParticipant?.id)
  const participantCount = viewerCount + 1

  useEffect(() => {
    if (!localVideoTrack || !localVideoContainer) {
      return
    }

    localVideoTrack.play(localVideoContainer)
  }, [localVideoContainer, localVideoTrack])

  useEffect(() => {
    remoteUsers.forEach((user) => {
      const container = remoteVideoRefs.current.get(user.uid)
      if (!container) {
        return
      }

      container.innerHTML = ''

      if (user.videoTrack) {
        user.videoTrack.play(container)
      }
    })
  }, [remoteUsers, remoteVideoVersion])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === screenRef.current)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  useEffect(() => {
    if (!isImmersiveMode) {
      setShowChrome(true)
      if (chromeHideTimeoutRef.current !== null) {
        window.clearTimeout(chromeHideTimeoutRef.current)
        chromeHideTimeoutRef.current = null
      }
      return
    }

    setShowChrome(true)
    if (chromeHideTimeoutRef.current !== null) {
      window.clearTimeout(chromeHideTimeoutRef.current)
    }

    chromeHideTimeoutRef.current = window.setTimeout(() => {
      setShowChrome(false)
    }, 2400)

    return () => {
      if (chromeHideTimeoutRef.current !== null) {
        window.clearTimeout(chromeHideTimeoutRef.current)
        chromeHideTimeoutRef.current = null
      }
    }
  }, [isImmersiveMode])

  const registerRemoteVideoRef = (uid: string | number, element: HTMLDivElement | null) => {
    if (element) {
      remoteVideoRefs.current.set(uid, element)
      return
    }

    remoteVideoRefs.current.delete(uid)
  }

  const handleChromeActivity = () => {
    if (!isImmersiveMode) {
      return
    }

    setShowChrome(true)
    if (chromeHideTimeoutRef.current !== null) {
      window.clearTimeout(chromeHideTimeoutRef.current)
    }

    chromeHideTimeoutRef.current = window.setTimeout(() => {
      setShowChrome(false)
    }, 2400)
  }

  const toggleFullscreen = async () => {
    if (!screenRef.current) {
      return
    }

    try {
      if (browserFullscreenSupported && document.fullscreenElement === screenRef.current) {
        await document.exitFullscreen()
        return
      }

      if (browserFullscreenSupported) {
        await screenRef.current.requestFullscreen()
        return
      }

      setIsPseudoFullscreen((value) => !value)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      console.error('[stream] fullscreen toggle failed:', error)
      setIsPseudoFullscreen((value) => !value)
    }
  }

  const renderPlaceholder = (participant: ParticipantCard, compact = false) => (
    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_rgba(15,23,42,0.96)_55%)]">
      <div className="px-4 text-center">
        <Monitor className={`${compact ? 'mx-auto mb-2 h-7 w-7' : 'mx-auto mb-4 h-14 w-14'} text-slate-500`} />
        <p className={`${compact ? 'text-xs' : 'text-base'} font-semibold text-white`}>
          {participant.label}
        </p>
        <p className={`${compact ? 'mt-1 text-[11px]' : 'mt-2 text-sm'} text-slate-400`}>
          {participant.isSharingScreen
            ? 'Sharing screen'
            : participant.hasAudio
              ? 'Camera off'
              : 'Waiting for media'}
        </p>
      </div>
    </div>
  )

  const renderParticipantMedia = (participant: ParticipantCard, compact = false) => {
    if (participant.isLocal) {
      if (!localVideoTrack) {
        return renderPlaceholder(participant, compact)
      }

      return <div ref={setLocalVideoContainer} className="h-full w-full" />
    }

    if (!participant.remoteUser?.videoTrack) {
      return renderPlaceholder(participant, compact)
    }

    return (
      <div
        key={`${participant.remoteUser!.uid}-${participant.remoteUser?.hasVideo ? 'video' : 'placeholder'}-${remoteVideoVersion}`}
        ref={(element) => {
          registerRemoteVideoRef(participant.remoteUser!.uid, element)
        }}
        className="h-full w-full"
      />
    )
  }

  const chromeClasses =
    isImmersiveMode && !showChrome
      ? 'pointer-events-none opacity-0'
      : 'pointer-events-auto opacity-100'

  return (
    <div
      ref={screenRef}
      className="fixed inset-0 z-50 overflow-hidden bg-slate-950 text-white"
      onMouseMove={handleChromeActivity}
      onTouchStart={handleChromeActivity}
      onClick={handleChromeActivity}
    >
      <div className="absolute inset-0">
        {focusedParticipant ? (
          renderParticipantMedia(focusedParticipant)
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-900">
            <div className="px-6 text-center">
              <Monitor className="mx-auto mb-4 h-16 w-16 text-slate-600" />
              <p className="text-lg font-semibold text-white">
                {isConnecting ? 'Joining room...' : 'Room is ready'}
              </p>
              <p className="mt-2 text-sm text-slate-400">
                {isHost
                  ? 'Turn on your mic, camera, or screen share to start the room.'
                  : 'Waiting for someone to publish video or screen share.'}
              </p>
            </div>
          </div>
        )}
      </div>

      <div
        className={`absolute inset-x-0 top-0 z-10 p-3 transition-all duration-300 sm:p-5 ${chromeClasses}`}
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-white/10 bg-black/45 px-3 py-2 backdrop-blur-md sm:px-4">
            <span className={`h-2 w-2 rounded-full ${isConnecting ? 'bg-yellow-400' : 'animate-pulse bg-red-500'}`} />
            <span className={`text-xs font-bold tracking-[0.24em] ${isConnecting ? 'text-yellow-300' : 'text-red-400'}`}>
              {isConnecting ? 'CONNECTING' : 'LIVE'}
            </span>
            <span className="text-xs text-white/40">|</span>
            <span className="min-w-0 truncate text-sm font-semibold text-white">{streamTitle}</span>
            <span className="text-xs text-slate-400">Hosted by {hostName}</span>
            {focusedParticipant ? (
              <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80">
                {focusedParticipant.label}
                {focusedParticipant.isSharingScreen ? ' sharing screen' : ''}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => {
                void toggleFullscreen()
              }}
              className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
              title={isImmersiveMode ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isImmersiveMode ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>
          </div>

          {agoraError ? (
            <div className="max-w-xl rounded-2xl border border-red-500/40 bg-red-950/70 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-300">
                Media connection notice
              </p>
              <p className="mt-1 text-sm text-red-100">{agoraError}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div
        className={`absolute inset-x-0 bottom-0 z-10 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-6 transition-all duration-300 sm:px-5 sm:pb-5 ${chromeClasses}`}
      >
        <div className="rounded-[28px] border border-white/10 bg-black/45 p-3 backdrop-blur-md shadow-2xl sm:p-4">
          {thumbnailParticipants.length > 0 ? (
            <div className="mb-3 flex gap-3 overflow-x-auto pb-1">
              {thumbnailParticipants.map((participant) => (
                <button
                  key={participant.id}
                  type="button"
                  onClick={() => setFocusedParticipantId(participant.id)}
                  className="group relative h-24 min-w-[9rem] overflow-hidden rounded-2xl border border-white/10 bg-slate-900 text-left transition hover:border-white/30 sm:h-28 sm:min-w-[10rem]"
                >
                  {renderParticipantMedia(participant, true)}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-3 pb-2 pt-5">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-xs font-semibold text-white">{participant.label}</p>
                      {participant.hasAudio ? (
                        <Mic className="h-3.5 w-3.5 text-emerald-300" />
                      ) : (
                        <MicOff className="h-3.5 w-3.5 text-red-300" />
                      )}
                    </div>
                    <p className="truncate text-[11px] text-white/65">
                      {participant.isSharingScreen ? 'Sharing screen' : participant.subtitle}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {isHost ? 'You are hosting this room' : `You are in ${hostName}'s room`}
              </p>
              <button
                type="button"
                onClick={() => setShowViewers((value) => !value)}
                className="mt-1 inline-flex items-center gap-2 text-xs text-slate-300 transition hover:text-white"
              >
                <Users className="h-3.5 w-3.5" />
                {participantCount} {participantCount === 1 ? 'person' : 'people'} in room
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onToggleMute}
                title={isMuted ? 'Unmute' : 'Mute'}
                className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${
                  isMuted
                    ? 'border-red-500/60 bg-red-500/20 text-red-300'
                    : 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={onToggleSpeaker}
                title={isSpeakerOff ? 'Turn speaker on' : 'Turn speaker off'}
                className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${
                  isSpeakerOff
                    ? 'border-amber-400/60 bg-amber-500/20 text-amber-200'
                    : 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {isSpeakerOff ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={onToggleVideo}
                title={isVideoOff ? 'Turn camera on' : 'Turn camera off'}
                disabled={isSharingScreen}
                className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${
                  isSharingScreen
                    ? 'cursor-not-allowed border-white/10 bg-white/5 text-white/40'
                    : isVideoOff
                      ? 'border-red-500/60 bg-red-500/20 text-red-300'
                      : 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={onToggleScreenShare}
                title={isSharingScreen ? 'Stop sharing screen' : 'Share screen'}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${
                  isSharingScreen
                    ? 'border-sky-400/60 bg-sky-500/20 text-sky-200'
                    : 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Monitor className="h-4 w-4" />
                {screenShareSupported
                  ? isSharingScreen
                    ? 'Stop Share'
                    : 'Share Screen'
                  : 'No Screen Share'}
              </button>

              <button
                type="button"
                onClick={() => {
                  void toggleFullscreen()
                }}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/20"
              >
                {isImmersiveMode ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                {isImmersiveMode ? 'Exit Fullscreen' : 'Fullscreen'}
              </button>

              <button
                type="button"
                onClick={() => setShowViewers((value) => !value)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${
                  showViewers
                    ? 'border-sky-400/60 bg-sky-500/20 text-sky-200'
                    : 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Users className="h-4 w-4" />
                People
              </button>

              {isHost ? (
                <button
                  type="button"
                  onClick={onEndStream}
                  className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  End Stream
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onLeaveStream}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                  Leave Room
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showViewers ? (
        <>
          <button
            type="button"
            onClick={() => setShowViewers(false)}
            className={`absolute inset-0 z-20 bg-black/50 transition-opacity duration-300 ${chromeClasses}`}
            aria-label="Close people panel"
          />
          <aside
            className={`absolute inset-y-0 right-0 z-30 flex w-[min(22rem,88vw)] flex-col border-l border-white/10 bg-slate-950/95 backdrop-blur-xl transition-all duration-300 ${chromeClasses}`}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-300" />
                <span className="text-sm font-semibold text-white">People in room</span>
                <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-xs font-semibold text-sky-200">
                  {participantCount}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowViewers(false)}
                className="rounded-full p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-500 text-sm font-bold text-white">
                    {hostName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{hostName}</p>
                    <p className="text-xs text-slate-400">{isHost ? 'Host (you)' : 'Host'}</p>
                  </div>
                </div>
              </div>

              {viewers.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                  <Users className="mb-3 h-8 w-8 text-slate-600" />
                  <p className="text-sm font-medium text-white/80">No other participants yet</p>
                  <p className="mt-1 text-xs text-slate-500">
                    When people join, they will appear here.
                  </p>
                </div>
              ) : (
                <ul className="mt-3 space-y-2">
                  {viewers.map((viewer) => (
                    <li
                      key={viewer.userId}
                      className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-3 py-3"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-sm font-bold text-white">
                        {viewer.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">{viewer.fullName}</p>
                        <p className="text-xs text-slate-400">Participant</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </>
      ) : null}
    </div>
  )
}
