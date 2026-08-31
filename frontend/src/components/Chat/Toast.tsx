import { AlertTriangle, Info, X } from 'lucide-react'
import type { Toast as ToastType } from '../../hooks/useToast'

interface ToastListProps {
  toasts: ToastType[]
  onDismiss: (id: string) => void
}

export function ToastList({ toasts, onDismiss }: ToastListProps) {
  if (toasts.length === 0) return null

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col items-center gap-2 p-3"
      aria-live="assertive"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className={`animate-toast-in pointer-events-auto flex w-full max-w-[360px] items-start gap-2 rounded-xl px-3.5 py-2.5 text-sm shadow-lg ${
            toast.variant === 'error' ? 'bg-red-600 text-white' : 'bg-gray-800 text-white'
          }`}
        >
          {toast.variant === 'error' ? (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <span className="flex-1">{toast.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
            className="shrink-0 rounded-full p-0.5 hover:bg-white/15"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  )
}
