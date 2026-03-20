import type { Message } from '../../types'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
}

const formatTime = (timestamp: string): string =>
  new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp))

export const MessageBubble = ({ message, isOwn }: MessageBubbleProps) => (
  <div className={`flex animate-fade-in flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
    <div
      className={`max-w-xs rounded-2xl px-4 py-2 text-sm leading-6 shadow-sm lg:max-w-md ${
        isOwn
          ? 'ml-auto bg-blue-500 text-white'
          : 'mr-auto border border-slate-200 bg-white text-slate-900'
      }`}
    >
      <p className="whitespace-pre-wrap break-words">{message.content}</p>
    </div>
    <span className="mt-1 px-1 text-xs text-slate-400">{formatTime(message.sentAt)}</span>
  </div>
)

