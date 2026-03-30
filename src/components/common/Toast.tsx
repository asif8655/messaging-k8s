import { AlertCircle, CheckCircle, Info, X } from 'lucide-react'
import { useEffect } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  onClose: () => void
  duration?: number
}

export const Toast = ({ message, type = 'info', onClose, duration = 3000 }: ToastProps) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-emerald-600" />,
    error: <AlertCircle className="h-5 w-5 text-red-600" />,
    info: <Info className="h-5 w-5 text-blue-600" />,
  }

  const bgColors = {
    success: 'bg-emerald-50 border-emerald-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
  }

  return (
    <div className="fixed right-4 top-4 z-50 animate-slideDown">
      <div className={`flex items-center gap-3 rounded-2xl border ${bgColors[type]} px-4 py-3 shadow-lg`}>
        {icons[type]}
        <p className="text-sm font-medium text-slate-900">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="ml-2 rounded-full p-1 text-slate-400 transition hover:bg-white/50 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
