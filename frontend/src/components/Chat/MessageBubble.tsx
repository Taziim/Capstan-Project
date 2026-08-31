import { AlertCircle, Check } from 'lucide-react'
import type { ChatMessage } from '../../types/chat'

function formatTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

function getDisplayName(senderId: string, senderType: ChatMessage['senderType']): string {
  if (senderType === 'agent') return 'Agent'
  const shortId = senderId.replace(/^anonymous_/, '').slice(0, 4)
  return `Guest ${shortId}`
}

export function MessageBubble({
  message,
  currentUserId,
}: {
  message: ChatMessage
  currentUserId: string | null
}) {
  const isOwn = message.senderId === currentUserId

  return (
    <div
      className={`flex animate-message-in flex-col ${isOwn ? 'items-end self-end' : 'items-start self-start'} max-w-[80%]`}
    >
      {!isOwn && (
        <span className="mb-1 px-1 text-[11px] font-medium text-gray-500">
          {getDisplayName(message.senderId, message.senderType)}
        </span>
      )}
      <div
        className="whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm"
        style={{
          backgroundColor: isOwn ? 'var(--chat-user-message)' : 'var(--chat-agent-message)',
          color: isOwn ? '#FFFFFF' : 'var(--chat-text)',
          borderRadius: 'var(--chat-radius)',
          opacity: message.pending ? 0.7 : 1,
        }}
      >
        {message.message}
      </div>
      <div className="mt-1 flex items-center gap-1 px-1 text-[11px] text-gray-400">
        <span>{formatTime(message.createdAt)}</span>
        {isOwn && message.failed && (
          <span className="flex items-center gap-0.5 text-red-500">
            <AlertCircle className="h-3 w-3" aria-hidden="true" />
            Failed to send
          </span>
        )}
        {isOwn && message.pending && !message.failed && <span>Sending...</span>}
        {isOwn && !message.pending && !message.failed && (
          <Check className="h-3 w-3 text-gray-400" aria-hidden="true" />
        )}
      </div>
    </div>
  )
}
