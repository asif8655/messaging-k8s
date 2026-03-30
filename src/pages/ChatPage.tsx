import { useCallback, useEffect, useState } from 'react'
import { AgoraVideoCallScreen } from '../components/call/AgoraVideoCallScreen'
import { ChatWindow } from '../components/chat/ChatWindow'
import { IncomingCallDialog } from '../components/chat/IncomingCallDialog'
import { UserList } from '../components/chat/UserList'
import { Navbar } from '../components/layout/Navbar'
import { Toast } from '../components/common/Toast'
import { StartStreamDialog } from '../components/stream/StartStreamDialog'
import { LiveStreamScreen } from '../components/stream/LiveStreamScreen'
import { StreamNotificationBanner } from '../components/stream/StreamNotificationBanner'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'
import { getActiveStream } from '../api/streamApi'
import { useStream } from '../hooks/useStream'
import type { StreamEventResponse } from '../types'

export const ChatPage = () => {
  const { user } = useAuth()
  const [showStartStreamDialog, setShowStartStreamDialog] = useState(false)
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  // Stream info shown in the notification banner
  const [pendingStream, setPendingStream] = useState<{
    streamId: string
    title: string
    hostName: string
    viewerCount: number
  } | null>(null)

  const {
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
    deleteMessageForMe,
    deleteMessageForBoth,
    deleteConversationForMe,
    deleteUser,
    // Video call
    callStatus,
    callType,
    callError,
    remoteUserName,
    localVideoTrack,
    remoteUsers,
    isMuted: callIsMuted,
    isSpeakerOff: callIsSpeakerOff,
    isVideoOff: callIsVideoOff,
    isSharingScreen,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute: callToggleMute,
    toggleSpeaker: callToggleSpeaker,
    toggleVideo: callToggleVideo,
    toggleScreenShare,
    // Stream events
    registerStreamEventHandler,
  } = useChat()

  // Stream hook — manages Agora SDK & backend calls for live streaming
  const stream = useStream(user?.id ?? null)
  const currentStreamId = stream.streamInfo?.streamId ?? null

  // Register the stream event handler with ChatContext so WebSocket events flow here
  useEffect(() => {
    const handler = (event: StreamEventResponse) => {
      if (event.eventType === 'stream-started') {
        setPendingStream({
          streamId: event.streamId,
          title: event.title ?? 'Live Stream',
          hostName: event.hostName,
          viewerCount: event.viewerCount ?? 0,
        })
      } else if (event.eventType === 'viewer-joined' || event.eventType === 'viewer-left') {
        if (currentStreamId === event.streamId) {
          void stream.refreshStreamInfo()
        }

        setPendingStream((current) => {
          if (!current || current.streamId !== event.streamId) {
            return current
          }

          return {
            ...current,
            viewerCount: event.viewerCount ?? current.viewerCount,
          }
        })
      } else if (event.eventType === 'stream-ended') {
        setPendingStream(null)

        if (stream.isStreaming && currentStreamId === event.streamId) {
          void stream.leaveLiveStream()
          setToastMessage({ message: 'The stream has ended.', type: 'info' })
        }
      }
    }

    registerStreamEventHandler(handler)

    // Also handle stream-ended while viewer is watching
    return () => {
      registerStreamEventHandler(null)
    }
  }, [currentStreamId, registerStreamEventHandler, stream, stream.isStreaming, stream.leaveLiveStream])

  // Force viewer out when the stream ends while they're watching
  useEffect(() => {
    if (!pendingStream && stream.isStreaming && !stream.isHost) {
      void stream.leaveLiveStream()
      setToastMessage({ message: 'The stream has ended.', type: 'info' })
    }
  // We intentionally only run this when pendingStream clears while in a viewer session
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingStream])

  // On mount, check if there is already an active stream and show the banner
  useEffect(() => {
    if (!user) return
    void (async () => {
      const active = await getActiveStream()
      if (active) {
        setPendingStream({
          streamId: active.streamId,
          title: active.title,
          hostName: active.hostName,
          viewerCount: active.viewerCount,
        })
      }
    })()
  }, [user])

  // Superuser clicks "Go Live" in the StartStreamDialog
  const handleStartStream = useCallback(async (title: string, description: string) => {
    setShowStartStreamDialog(false)
    try {
      await stream.startLiveStream(title, description)
    } catch {
      setToastMessage({ message: stream.error ?? 'Failed to start stream', type: 'error' })
    }
  }, [stream])

  // Viewer clicks "Join Stream" on the notification banner
  const handleJoinStream = useCallback(async () => {
    if (!pendingStream) return
    setPendingStream(null)
    try {
      await stream.joinLiveStream(pendingStream.streamId)
    } catch {
      setToastMessage({ message: stream.error ?? 'Failed to join stream', type: 'error' })
    }
  }, [pendingStream, stream])

  // Navbar stream button
  const handleNavbarStreamClick = useCallback(async () => {
    if (user?.isSuperUser) {
      if (stream.isStreaming) return   // already broadcasting — managed from LiveStreamScreen
      setShowStartStreamDialog(true)
    } else {
      const active = await getActiveStream()
      if (active) {
        try {
          await stream.joinLiveStream(active.streamId)
        } catch {
          setToastMessage({ message: stream.error ?? 'Failed to join stream', type: 'error' })
        }
      } else {
        setToastMessage({
          message: 'No active stream. A superuser has not started one yet.',
          type: 'error',
        })
      }
    }
  }, [user, stream])

  // ── While auto-restoring a previous stream session (e.g. after page refresh) ──
  if (stream.isRestoring) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-slate-900">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-red-500" />
        <p className="text-base font-semibold text-white">Reconnecting to stream...</p>
        <p className="text-sm text-slate-400">This will only take a moment</p>
      </div>
    )
  }

  // ── Full-screen stream view ──
  if (stream.isStreaming && stream.streamInfo) {
    return (
      <LiveStreamScreen
        isHost={stream.isHost}
        streamTitle={stream.streamInfo.title}
        hostName={stream.streamInfo.hostName}
        viewerCount={stream.streamInfo.viewerCount}
        viewers={stream.streamInfo.viewers ?? []}
        localVideoTrack={stream.localVideoTrack}
        remoteUsers={stream.remoteUsers}
        isMuted={stream.isMuted}
        isSpeakerOff={stream.isSpeakerOff}
        isVideoOff={stream.isVideoOff}
        isSharingScreen={stream.isSharingScreen}
        isConnecting={stream.isConnecting}
        agoraError={stream.agoraError}
        onEndStream={() => { void stream.endLiveStream() }}
        onLeaveStream={() => { void stream.leaveLiveStream() }}
        onToggleMute={() => { void stream.toggleMute() }}
        onToggleSpeaker={() => { stream.toggleSpeaker() }}
        onToggleVideo={() => { void stream.toggleVideo() }}
        onToggleScreenShare={() => { void stream.toggleScreenShare() }}
      />
    )
  }

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col overflow-hidden">
      <Navbar
        onStreamClick={() => { void handleNavbarStreamClick() }}
        onEndStream={stream.isHost ? () => { void stream.endLiveStream() } : undefined}
        isStreaming={stream.isStreaming && stream.isHost}
        hasActiveStream={!!pendingStream}
      />
      <main className="flex min-h-0 flex-1 px-0 py-0 sm:px-5 sm:py-5">
        <div className="flex min-h-0 flex-1 overflow-hidden border-y border-white/70 bg-white/75 shadow-panel backdrop-blur sm:rounded-[32px] sm:border">
          <div className={`${activeUser ? 'hidden sm:flex' : 'flex'} min-h-0 w-full sm:w-80 lg:w-96`}>
            <UserList
              users={users}
              activeUser={activeUser}
              currentUser={user}
              unreadCounts={unreadCounts}
              isLoading={usersLoading}
              error={usersError}
              onSelectUser={(selectedUser) => {
                void selectUser(selectedUser)
              }}
              onRetry={() => {
                void refreshUsers()
              }}
              onDeleteUser={(userId) => {
                void deleteUser(userId)
              }}
            />
          </div>
          <div className={`${activeUser ? 'flex' : 'hidden sm:flex'} min-h-0 flex-1`}>
            <ChatWindow
              activeUser={activeUser}
              currentUserId={user?.id ?? null}
              messages={messages}
              isLoading={messagesLoading}
              error={messagesError}
              isConnected={isConnected}
              connectionError={connectionError}
              isSending={isSending}
              canDeleteActiveUser={Boolean(user?.isSuperUser && activeUser && user.id !== activeUser.id)}
              onBack={clearActiveUser}
              onSend={sendMessage}
              onDeleteForMe={(messageId) => {
                void deleteMessageForMe(messageId)
              }}
              onDeleteForBoth={(messageId) => {
                void deleteMessageForBoth(messageId)
              }}
              onDeleteConversation={(userId) => {
                void deleteConversationForMe(userId)
              }}
              onDeleteActiveUser={(userId) => {
                void deleteUser(userId)
              }}
              onStartVideoCall={(targetUserId, videoEnabled) => {
                if (!activeUser) return
                void startCall(targetUserId, activeUser.fullName, videoEnabled)
              }}
              callStatus={callStatus}
            />
          </div>
        </div>
      </main>

      <AgoraVideoCallScreen
        callStatus={callStatus}
        callType={callType}
        callError={callError}
        remoteUserName={remoteUserName}
        localVideoTrack={localVideoTrack}
        remoteUsers={remoteUsers}
        isMuted={callIsMuted}
        isSpeakerOff={callIsSpeakerOff}
        isVideoOff={callIsVideoOff}
        isSharingScreen={isSharingScreen}
        onEndCall={endCall}
        onToggleMute={() => { void callToggleMute() }}
        onToggleSpeaker={() => { callToggleSpeaker() }}
        onToggleVideo={() => { void callToggleVideo() }}
        onToggleScreenShare={() => { void toggleScreenShare() }}
      />

      <IncomingCallDialog
        open={callStatus === 'incoming'}
        callerName={remoteUserName}
        callType={callType}
        onAccept={() => {
          void acceptCall()
        }}
        onReject={rejectCall}
      />

      {/* Stream start dialog – superuser only */}
      {user?.isSuperUser && (
        <StartStreamDialog
          open={showStartStreamDialog}
          onClose={() => setShowStartStreamDialog(false)}
          onStart={(title, description) => {
            void handleStartStream(title, description)
          }}
        />
      )}

      {/* Live stream notification banner */}
      {pendingStream && !stream.isStreaming && (
        <StreamNotificationBanner
          streamTitle={pendingStream.title}
          hostName={pendingStream.hostName}
          viewerCount={pendingStream.viewerCount}
          onJoin={() => { void handleJoinStream() }}
          onDismiss={() => setPendingStream(null)}
        />
      )}

      {/* Toast notifications */}
      {toastMessage && (
        <Toast
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  )
}
