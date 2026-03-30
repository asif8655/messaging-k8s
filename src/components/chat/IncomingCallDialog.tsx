import { Phone, PhoneOff, Video, type LucideIcon } from 'lucide-react'
import type { AgoraCallType } from '../../types'

interface IncomingCallDialogProps {
  open: boolean
  callerName: string | null
  callType?: AgoraCallType
  onAccept: () => void
  onReject: () => void
}

export const IncomingCallDialog = ({
  open,
  callerName,
  callType = 'video',
  onAccept,
  onReject,
}: IncomingCallDialogProps) => {
  if (!open) {
    return null
  }

  const CallIcon: LucideIcon = callType === 'audio' ? Phone : Video

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm animate-[slideUp_0.3s_ease-out] rounded-[28px] border border-white/20 bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-5">
            <div className="absolute inset-0 animate-ping rounded-full bg-sky-200/50" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 sm:h-20 sm:w-20">
              <CallIcon className="h-8 w-8 text-sky-600 sm:h-9 sm:w-9" />
            </div>
          </div>

          <h3 className="text-xl font-semibold text-slate-900">
            Incoming {callType === 'audio' ? 'Audio' : 'Video'} Call
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            <span className="font-medium text-slate-700">{callerName ?? 'Someone'}</span> is
            calling you
          </p>

          <div className="mt-8 flex w-full items-center justify-center gap-6">
            <button
              type="button"
              onClick={onReject}
              className="flex flex-col items-center gap-2"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-700 sm:h-16 sm:w-16">
                <PhoneOff className="h-6 w-6 sm:h-7 sm:w-7" />
              </span>
              <span className="text-xs font-medium text-slate-500">Decline</span>
            </button>

            <button
              type="button"
              onClick={onAccept}
              className="flex flex-col items-center gap-2"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition hover:bg-emerald-700 sm:h-16 sm:w-16">
                <Phone className="h-6 w-6 sm:h-7 sm:w-7" />
              </span>
              <span className="text-xs font-medium text-slate-500">Accept</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
