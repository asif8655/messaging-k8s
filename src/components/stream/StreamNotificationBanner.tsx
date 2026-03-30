import { Radio, X } from 'lucide-react'

interface StreamNotificationBannerProps {
  streamTitle: string
  hostName: string
  viewerCount: number
  onJoin: () => void
  onDismiss: () => void
}

export const StreamNotificationBanner = ({
  streamTitle,
  hostName,
  viewerCount,
  onJoin,
  onDismiss,
}: StreamNotificationBannerProps) => {
  return (
    <div className="fixed left-1/2 top-4 z-40 w-full max-w-md -translate-x-1/2 animate-slideDown px-4">
      <div className="overflow-hidden rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-pink-50 shadow-lg">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-500">
              <Radio className="h-5 w-5 text-white" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                <span className="text-xs font-bold uppercase tracking-wide text-red-600">
                  Live Now
                </span>
              </div>
              <h3 className="mt-1 font-bold text-slate-900">{streamTitle}</h3>
              <p className="mt-0.5 text-sm text-slate-600">
                {hostName} • {viewerCount} watching
              </p>

              <button
                type="button"
                onClick={onJoin}
                className="mt-3 w-full rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Join Stream
              </button>
            </div>

            <button
              type="button"
              onClick={onDismiss}
              className="flex-shrink-0 rounded-full p-1 text-slate-400 transition hover:bg-white/50 hover:text-slate-600"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
