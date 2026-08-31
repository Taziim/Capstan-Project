import { useMemo, useState, type CSSProperties } from 'react'
import { useChat, MAX_MESSAGE_LENGTH } from '../../hooks/useChat'
import { ChatHeader } from './ChatHeader'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { ConnectionStatus } from './ConnectionStatus'
import { ToastList } from './Toast'

export function ChatBox() {
  const {
    config,
    userId,
    messages,
    isInitializing,
    agentTyping,
    connectionState,
    sendChatMessage,
    handleTyping,
    emitStopTyping,
    toasts,
    dismissToast,
  } = useChat()

  const [isMinimized, setIsMinimized] = useState(false)

  const themeStyle = useMemo(
    () => ({
      '--chat-primary': config.primaryColor,
      '--chat-secondary': config.secondaryColor,
      '--chat-user-message': config.userMessageColor,
      '--chat-agent-message': config.agentMessageColor,
      '--chat-text': config.textColor,
      '--chat-background': config.backgroundColor,
      '--chat-header': config.headerColor,
      '--chat-header-text': config.headerTextColor,
      '--chat-input-background': config.inputBackgroundColor,
      '--chat-radius': config.borderRadius,
    }),
    [config],
  ) as CSSProperties

  return (
    <div
      style={themeStyle}
      className={`relative flex w-full flex-col overflow-hidden shadow-2xl transition-[height] duration-200 sm:w-[420px] sm:max-w-[92vw] sm:rounded-[var(--chat-radius)] ${
        isMinimized ? 'h-auto' : 'h-[100dvh] sm:h-[700px] sm:max-h-[90vh]'
      }`}
      role="region"
      aria-label="Anonymous chat"
    >
      <div
        className="flex h-full flex-col"
        style={{ backgroundColor: 'var(--chat-background)' }}
      >
        <ChatHeader
          connectionState={connectionState}
          isMinimized={isMinimized}
          onToggleMinimize={() => setIsMinimized((v) => !v)}
        />

        {!isMinimized && (
          <>
            <ConnectionStatus state={connectionState} />
            <div className="min-h-0 flex-1">
              <MessageList
                messages={messages}
                isLoading={isInitializing && messages.length === 0}
                agentTyping={agentTyping}
                currentUserId={userId}
              />
            </div>
            <MessageInput
              onSend={sendChatMessage}
              onTyping={handleTyping}
              onStopTyping={emitStopTyping}
              disabled={isInitializing}
              maxLength={MAX_MESSAGE_LENGTH}
            />
          </>
        )}
      </div>

      <ToastList toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
