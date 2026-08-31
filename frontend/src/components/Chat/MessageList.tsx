import { useEffect, useRef, useState } from 'react'
import type { ChatMessage } from '../../types/chat'
import { MessageBubble } from './MessageBubble'
import { EmptyChat } from './EmptyChat'
import { TypingIndicator } from './TypingIndicator'

function MessageSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
          <div
            className="skeleton h-10 rounded-2xl"
            style={{ width: `${50 + ((i * 17) % 30)}%` }}
          />
        </div>
      ))}
    </div>
  )
}

interface MessageListProps {
  messages: ChatMessage[]
  isLoading: boolean
  agentTyping: boolean
  currentUserId: string | null
}

export function MessageList({ messages, isLoading, agentTyping, currentUserId }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const previousMessageCount = useRef(0)

  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setIsNearBottom(distanceFromBottom < 80)
  }

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const grew = messages.length > previousMessageCount.current
    const lastMessage = messages[messages.length - 1]
    const isOwnMessage = lastMessage?.senderId === currentUserId

    if (grew && (isNearBottom || isOwnMessage || previousMessageCount.current === 0)) {
      el.scrollTo({ top: el.scrollHeight, behavior: previousMessageCount.current === 0 ? 'auto' : 'smooth' })
    }
    previousMessageCount.current = messages.length
  }, [messages, isNearBottom, currentUserId])

  useEffect(() => {
    if (!agentTyping) return
    const el = containerRef.current
    if (!el || !isNearBottom) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [agentTyping, isNearBottom])

  if (isLoading) {
    return <MessageSkeleton />
  }

  if (messages.length === 0 && !agentTyping) {
    return <EmptyChat />
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="chat-scroll flex h-full flex-col gap-3 overflow-y-auto p-4"
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
    >
      {messages.map((message) => (
        <MessageBubble key={message.messageId} message={message} currentUserId={currentUserId} />
      ))}
      {agentTyping && <TypingIndicator />}
    </div>
  )
}
