import { AlertTriangle, X } from 'lucide-react'
import type { ReactNode } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  tone?: 'danger' | 'default'
  isProcessing?: boolean
  icon?: ReactNode
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'danger',
  isProcessing = false,
  icon,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  if (!open) {
    return null
  }

  const isDanger = tone === 'danger'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
        onClick={onCancel}
        aria-label="Close confirmation dialog"
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="flex items-start gap-4">
            <div
              className={`mt-0.5 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${
                isDanger ? 'bg-rose-100 text-rose-600' : 'bg-sky-100 text-sky-700'
              }`}
            >
              {icon ?? <AlertTriangle className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col-reverse gap-3 bg-slate-50/80 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className={`inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isDanger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-sky-600 hover:bg-sky-700'
            }`}
          >
            {isProcessing ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}