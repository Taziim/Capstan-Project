import { MessageCircle } from 'lucide-react'

export function EmptyChat() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ backgroundColor: 'var(--chat-secondary)' }}
        aria-hidden="true"
      >
        <MessageCircle className="h-7 w-7" style={{ color: 'var(--chat-primary)' }} />
      </div>
      <h3 className="text-base font-semibold" style={{ color: 'var(--chat-text)' }}>
        Fully anonymous
      </h3>
      <p className="max-w-[280px] text-sm text-gray-500">
        No fingerprint. No database. No saved chat history. Everyone here can see this live.
      </p>
    </div>
  )
}
