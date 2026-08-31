import { Headset, Minus } from 'lucide-react'
import type { ConnectionState } from '../../types/chat'

interface ChatHeaderProps {
  connectionState: ConnectionState
  isMinimized: boolean
  onToggleMinimize: () => void
}

export function ChatHeader({ connectionState, isMinimized, onToggleMinimize }: ChatHeaderProps) {
  const isOnline = connectionState === 'connected'

  return (
    <header
      className="flex items-center justify-between gap-3 px-4 py-3.5"
      style={{
        backgroundColor: 'var(--chat-header)',
        color: 'var(--chat-header-text)',
        borderTopLeftRadius: 'var(--chat-radius)',
        borderTopRightRadius: 'var(--chat-radius)',
      }}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15" aria-hidden="true">
          <Headset className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">Anonymous</p>
          <p className="flex items-center gap-1.5 text-xs opacity-90">
            <span
              className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-300'}`}
              aria-hidden="true"
            />
            {isOnline ? 'Online' : 'Connecting'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onToggleMinimize}
          aria-label={isMinimized ? 'Expand chat' : 'Minimize chat'}
          aria-expanded={!isMinimized}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/15"
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
