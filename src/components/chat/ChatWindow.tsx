import { ArrowLeft, MessageCircleMore, MoreVertical, Phone, Trash2, UserX, Video, Wifi, WifiOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import type { AgoraCallStatus } from '../../hooks/useAgoraCall'
import type { Message, User } from '../../types'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'

interface ChatWindowProps {
  activeUser: User | null
  currentUserId: string | null
  messages: Message[]
  isLoading: boolean
  error: string | null
  isConnected: boolean
  connectionError: string | null
  isSending: boolean
  canDeleteActiveUser: boolean
  onBack: () => void
  onSend: (content: string) => Promise<void>
  onDeleteForMe: (messageId: string) => void
  onDeleteForBoth: (messageId: string) => void
  onDeleteConversation: (userId: string) => void
  onDeleteActiveUser: (userId: string) => void
  onStartVideoCall: (targetUserId: string, videoEnabled?: boolean) => void
  callStatus: AgoraCallStatus
}

export const ChatWindow = ({
  activeUser,
  currentUserId,
  messages,
  isLoading,
  error,
  isConnected,
  connectionError,
  isSending,
  canDeleteActiveUser,
  onBack,
  onSend,
  onDeleteForMe,
  onDeleteForBoth,
  onDeleteConversation,
  onDeleteActiveUser,
  onStartVideoCall,
  callStatus,
}: ChatWindowProps) => {
  const threadEndRef = useRef<HTMLDivElement | null>(null)
  const [showActionsMenu, setShowActionsMenu] = useState(false)
  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false)
  const [showDeleteChatDialog, setShowDeleteChatDialog] = useState(false)

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    setShowActionsMenu(false)
    setShowDeleteUserDialog(false)
    setShowDeleteChatDialog(false)
  }, [activeUser?.id])

  if (!activeUser) {
    return (
      <section className="flex min-h-0 flex-1 flex-col items-center justify-center bg-[linear-gradient(180deg,rgba(238,244,255,0.7),rgba(255,255,255,0.96))] p-8 text-center">
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/75 p-10 shadow-sm backdrop-blur">
          <span className="mx-auto inline-flex rounded-3xl bg-sky-100 p-4 text-sky-700">
            <MessageCircleMore className="h-8 w-8" />
          </span>
          <h2 className="mt-5 text-2xl font-semibold text-slate-900">Select a conversation</h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">
            Choose a verified user from the left sidebar to load conversation history and start
            sending messages.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-[linear-gradient(180deg,rgba(238,244,255,0.72),rgba(255,255,255,0.98))]">
      <header className="border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 sm:hidden"
              aria-label="Back to conversations"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-slate-900">{activeUser.fullName}</h2>
              <p className="truncate text-sm text-slate-500">{activeUser.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <div
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                isConnected
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {isConnected ? 'Connected' : 'Reconnecting'}
            </div>

            <button
              type="button"
              onClick={() => onStartVideoCall(activeUser.id, false)}
              disabled={!isConnected || callStatus !== 'idle'}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-emerald-600 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Start audio call"
              title="Start audio call"
            >
              <Phone className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => onStartVideoCall(activeUser.id, true)}
              disabled={!isConnected || callStatus !== 'idle'}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-sky-600 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Start video call"
              title="Start video call"
            >
              <Video className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => setShowActionsMenu((currentValue) => !currentValue)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-white hover:text-slate-700"
              aria-label="Conversation actions"
              aria-expanded={showActionsMenu}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>
        {showActionsMenu ? (
          <div className="mt-4 flex flex-wrap justify-end gap-2 rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-sm">
            <button
              type="button"
              onClick={() => {
                setShowDeleteChatDialog(true)
                setShowActionsMenu(false)
              }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Trash2 className="h-4 w-4 text-slate-500" />
              Delete chat
            </button>
            {canDeleteActiveUser ? (
              <button
                type="button"
                onClick={() => {
                  setShowDeleteUserDialog(true)
                  setShowActionsMenu(false)
                }}
                className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 transition hover:border-rose-300 hover:bg-rose-100"
              >
                <UserX className="h-4 w-4" />
                Delete user
              </button>
            ) : null}
          </div>
        ) : null}
        {connectionError ? (
          <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {connectionError}
          </div>
        ) : null}
        {error ? (
          <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
      </header>

      <div className="app-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-5">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 7 }).map((_, index) => (
              <div
                key={index}
                className={`animate-pulse rounded-3xl px-4 py-3 shadow-sm ${
                  index % 2 === 0 ? 'mr-auto w-48 bg-white' : 'ml-auto w-56 bg-sky-100'
                }`}
              />
            ))}
          </div>
        ) : null}

        {!isLoading && messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/80 p-8 text-center shadow-sm">
              <p className="text-lg font-semibold text-slate-900">No messages yet</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Send the first message to start this conversation.
              </p>
            </div>
          </div>
        ) : null}

        {!isLoading && messages.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === currentUserId}
                onDeleteForMe={onDeleteForMe}
                onDeleteForBoth={onDeleteForBoth}
              />
            ))}
            <div ref={threadEndRef} />
          </div>
        ) : null}
      </div>

      <MessageInput
        key={activeUser.id}
        activeUser={activeUser}
        disabled={!isConnected || !activeUser || isLoading}
        isConnected={isConnected}
        isSending={isSending}
        onSend={onSend}
      />

      <ConfirmDialog
        open={showDeleteChatDialog}
        title={`Delete chat with ${activeUser.fullName}?`}
        description="This will remove all messages in this conversation only for you. This action cannot be undone."
        confirmLabel="Delete chat"
        icon={<Trash2 className="h-5 w-5" />}
        onCancel={() => setShowDeleteChatDialog(false)}
        onConfirm={() => {
          onDeleteConversation(activeUser.id)
          setShowDeleteChatDialog(false)
        }}
      />

      <ConfirmDialog
        open={showDeleteUserDialog}
        title={`Delete ${activeUser.fullName}?`}
        description="This will permanently remove this user and all messages in this conversation. This action cannot be undone."
        confirmLabel="Delete user"
        icon={<UserX className="h-5 w-5" />}
        onCancel={() => setShowDeleteUserDialog(false)}
        onConfirm={() => {
          onDeleteActiveUser(activeUser.id)
          setShowDeleteUserDialog(false)
        }}
      />
    </section>
  )
}
