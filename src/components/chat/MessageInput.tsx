import { SendHorizontal } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'

import type { User } from '../../types'

interface MessageInputProps {
  activeUser: User | null
  disabled: boolean
  isConnected: boolean
  isSending: boolean
  onSend: (content: string) => Promise<void>
}

export const MessageInput = ({
  activeUser,
  disabled,
  isConnected,
  isSending,
  onSend,
}: MessageInputProps) => {
  const [value, setValue] = useState('')

  const canSend = value.trim().length > 0 && !disabled

  const handleSend = async () => {
    const content = value.trim()

    if (!content) {
      return
    }

    await onSend(content)
    setValue('')
  }

  const handleKeyDown = async (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()

      if (!canSend) {
        return
      }

      await handleSend()
    }
  }

  return (
    <div className="border-t border-slate-200 bg-white/90 p-4 backdrop-blur">
      <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-3 shadow-sm">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={2}
          placeholder={
            activeUser
              ? `Message ${activeUser.fullName}...`
              : 'Choose a conversation to start typing'
          }
          className="max-h-32 min-h-[56px] w-full resize-none bg-transparent px-2 py-1 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            {isConnected
              ? 'Press Enter to send. Shift+Enter adds a new line.'
              : 'Waiting for realtime connection...'}
          </p>
          <button
            type="button"
            onClick={() => {
              void handleSend()
            }}
            disabled={!canSend || isSending}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <SendHorizontal className="h-4 w-4" />
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
