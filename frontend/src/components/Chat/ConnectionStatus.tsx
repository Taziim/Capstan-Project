import type { ConnectionState } from '../../types/chat'

const STATUS_COPY: Record<ConnectionState, { label: string; dotClass: string }> = {
  connected: { label: 'Connected', dotClass: 'bg-emerald-400' },
  connecting: { label: 'Connecting...', dotClass: 'bg-amber-300' },
  reconnecting: { label: 'Reconnecting...', dotClass: 'bg-amber-300' },
  disconnected: { label: 'Offline', dotClass: 'bg-red-400' },
}

export function ConnectionStatus({ state }: { state: ConnectionState }) {
  if (state === 'connected') return null

  const { label, dotClass } = STATUS_COPY[state]

  return (
    <div
      className="flex items-center justify-center gap-2 border-b border-black/5 bg-amber-50 px-4 py-1.5 text-xs font-medium text-amber-800"
      role="status"
      aria-live="polite"
    >
      <span className={`h-2 w-2 rounded-full ${dotClass} ${state !== 'disconnected' ? 'animate-pulse' : ''}`} aria-hidden="true" />
      {label}
    </div>
  )
}
