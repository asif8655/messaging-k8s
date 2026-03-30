import { MessageSquareWarning, MoreVertical, Trash2 } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useEffect, useRef, useState } from 'react'

import type { Message } from '../../types'
import { ConfirmDialog } from '../common/ConfirmDialog'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  onDeleteForMe: (messageId: string) => void
  onDeleteForBoth: (messageId: string) => void
}

interface MenuPosition {
  top: number
  left: number
}

const formatTime = (timestamp: string): string =>
  new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp))

export const MessageBubble = ({
  message,
  isOwn,
  onDeleteForMe,
  onDeleteForBoth,
}: MessageBubbleProps) => {
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteForBothDialog, setShowDeleteForBothDialog] = useState(false)
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null)
  const menuButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!showMenu) {
      setMenuPosition(null)
      return
    }

    const updateMenuPosition = () => {
      const button = menuButtonRef.current

      if (!button) {
        return
      }

      const rect = button.getBoundingClientRect()
      const menuWidth = 224
      const menuHeight = isOwn ? 116 : 64
      const viewportPadding = 12
      const gap = 8

      let left = isOwn ? rect.right - menuWidth : rect.left
      let top = rect.bottom + gap

      if (left + menuWidth > window.innerWidth - viewportPadding) {
        left = window.innerWidth - menuWidth - viewportPadding
      }

      if (left < viewportPadding) {
        left = viewportPadding
      }

      if (top + menuHeight > window.innerHeight - viewportPadding) {
        top = rect.top - menuHeight - gap
      }

      if (top < viewportPadding) {
        top = viewportPadding
      }

      setMenuPosition({ top, left })
    }

    updateMenuPosition()

    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updateMenuPosition, true)

    return () => {
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', updateMenuPosition, true)
    }
  }, [isOwn, showMenu])

  const handleDeleteForMe = () => {
    onDeleteForMe(message.id)
    setShowMenu(false)
  }

  const handleDeleteForBoth = () => {
    setShowDeleteForBothDialog(true)
    setShowMenu(false)
  }

  const menu =
    showMenu && menuPosition
      ? createPortal(
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
              aria-hidden="true"
            />
            <div
              className="fixed z-50 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur"
              style={{ top: menuPosition.top, left: menuPosition.left }}
            >
              <div className="border-b border-slate-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Message actions
              </div>
              <button
                type="button"
                onClick={handleDeleteForMe}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <span className="inline-flex rounded-xl bg-slate-100 p-2 text-slate-500">
                  <Trash2 className="h-4 w-4" />
                </span>
                <span>Delete for me</span>
              </button>
              {isOwn ? (
                <button
                  type="button"
                  onClick={handleDeleteForBoth}
                  className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-3 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                >
                  <span className="inline-flex rounded-xl bg-rose-100 p-2 text-rose-600">
                    <Trash2 className="h-4 w-4" />
                  </span>
                  <span>Delete for everyone</span>
                </button>
              ) : null}
            </div>
          </>,
          document.body,
        )
      : null

  return (
    <>
      <div className={`flex animate-fade-in flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className="group relative">
          <div
            className={`max-w-[calc(100vw-6rem)] rounded-2xl px-4 py-2 text-sm leading-6 shadow-sm sm:max-w-xs lg:max-w-md ${
              isOwn
                ? 'ml-auto bg-blue-500 text-white'
                : 'mr-auto border border-slate-200 bg-white text-slate-900'
            }`}
          >
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          </div>

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setShowMenu((currentValue) => !currentValue)}
            className={`absolute top-1 rounded-full bg-white/95 p-1.5 shadow-sm ring-1 ring-slate-200 transition ${
              isOwn ? 'left-[-38px]' : 'right-[-38px]'
            } ${showMenu ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100'}`}
            aria-label="Message options"
          >
            <MoreVertical className="h-4 w-4 text-slate-500 hover:text-slate-700" />
          </button>
        </div>

        <span className="mt-1 px-1 text-xs text-slate-400">{formatTime(message.sentAt)}</span>
      </div>

      {menu}

      <ConfirmDialog
        open={showDeleteForBothDialog}
        title="Delete message for everyone?"
        description="This will permanently remove the message from both sides of the conversation. This action cannot be undone."
        confirmLabel="Delete for everyone"
        icon={<MessageSquareWarning className="h-5 w-5" />}
        onCancel={() => setShowDeleteForBothDialog(false)}
        onConfirm={() => {
          onDeleteForBoth(message.id)
          setShowDeleteForBothDialog(false)
        }}
      />
    </>
  )
}
