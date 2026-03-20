import { MessageCircleMore, Wifi, WifiOff } from 'lucide-react'
import { useEffect, useRef } from 'react'

import type { Message, User } from '../../types'
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
  onSend: (content: string) => Promise<void>
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
  onSend,
}: ChatWindowProps) => {
  const threadEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
      <header className="border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{activeUser.fullName}</h2>
            <p className="text-sm text-slate-500">{activeUser.email}</p>
          </div>
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
        </div>
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

      <div className="app-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
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
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === currentUserId}
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
    </section>
  )
}
