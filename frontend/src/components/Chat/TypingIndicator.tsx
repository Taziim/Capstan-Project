export function TypingIndicator() {
  return (
    <div
      className="flex items-center gap-2 self-start rounded-2xl px-4 py-2.5 animate-message-in"
      style={{ backgroundColor: 'var(--chat-agent-message)' }}
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Agent is typing…</span>
      <span className="flex items-center gap-1" aria-hidden="true">
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-gray-500" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-gray-500" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-gray-500" />
      </span>
      <span className="text-xs text-gray-500">Agent is typing...</span>
    </div>
  )
}
