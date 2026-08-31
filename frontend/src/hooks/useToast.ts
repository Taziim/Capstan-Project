import { useCallback, useRef, useState } from 'react'

export interface Toast {
  id: string
  message: string
  variant: 'error' | 'info'
}

let counter = 0

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const showToast = useCallback(
    (message: string, variant: Toast['variant'] = 'error') => {
      counter += 1
      const id = `toast_${counter}`
      setToasts((current) => [...current, { id, message, variant }])
      const timer = setTimeout(() => dismissToast(id), 5000)
      timers.current.set(id, timer)
    },
    [dismissToast],
  )

  return { toasts, showToast, dismissToast }
}
