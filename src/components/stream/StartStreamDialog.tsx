import { Radio, X } from 'lucide-react'
import { useState } from 'react'

interface StartStreamDialogProps {
  open: boolean
  onClose: () => void
  onStart: (title: string, description: string) => void
}

export const StartStreamDialog = ({ open, onClose, onStart }: StartStreamDialogProps) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  if (!open) return null

  const handleStart = () => {
    if (title.trim()) {
      onStart(title, description)
      setTitle('')
      setDescription('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Radio className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Start Live Stream</h2>
              <p className="text-sm text-slate-500">Broadcast to all users</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="stream-title" className="mb-2 block text-sm font-medium text-slate-700">
              Stream Title *
            </label>
            <input
              id="stream-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Weekly Q&A Session"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 transition focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              maxLength={100}
            />
          </div>

          <div>
            <label
              htmlFor="stream-description"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Description (Optional)
            </label>
            <textarea
              id="stream-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers what this stream is about..."
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 transition focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              maxLength={500}
            />
          </div>

          <div className="rounded-xl bg-amber-50 p-4">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Your stream will be visible to all platform users. Only
              superusers can start streams.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-slate-200 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStart}
              disabled={!title.trim()}
              className="flex-1 rounded-full bg-red-500 px-6 py-3 font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Go Live
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
