import { useRef, useState, type KeyboardEvent } from 'react'
import { Send } from 'lucide-react'

interface MessageInputProps {
  onSend: (text: string) => void
  onTyping: () => void
  onStopTyping: () => void
  disabled: boolean
  maxLength: number
}

export function MessageInput({ onSend, onTyping, onStopTyping, disabled, maxLength }: MessageInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isEmpty = value.trim().length === 0
  const canSend = !isEmpty && !disabled && value.length <= maxLength

  const resize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  const handleChange = (text: string) => {
    if (text.length > maxLength) return
    setValue(text)
    if (text.trim().length > 0) {
      onTyping()
    } else {
      onStopTyping()
    }
  }

  const handleSend = () => {
    if (!canSend) return
    onSend(value)
    setValue('')
    onStopTyping()
    requestAnimationFrame(resize)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className="border-t border-black/5 p-3"
      style={{ backgroundColor: 'var(--chat-input-background)' }}
    >
      <div className="flex items-end gap-2">
        <label htmlFor="chat-message-input" className="sr-only">
          Type your message
        </label>
        <textarea
          id="chat-message-input"
          ref={textareaRef}
          value={value}
          onChange={(event) => {
            handleChange(event.target.value)
            resize()
          }}
          onKeyDown={handleKeyDown}
          onBlur={onStopTyping}
          disabled={disabled}
          rows={1}
          placeholder={disabled ? 'Connecting...' : 'Type your message...'}
          aria-label="Type your message"
          className="max-h-[120px] min-h-[40px] flex-1 resize-none rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus-visible:border-transparent disabled:cursor-not-allowed disabled:bg-gray-50"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send message"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-transform duration-150 enabled:hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ backgroundColor: 'var(--chat-primary)' }}
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-1 flex justify-end px-1">
        <span
          className={`text-[11px] ${value.length > maxLength * 0.9 ? 'text-amber-600' : 'text-gray-400'}`}
          aria-live="polite"
        >
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  )
}
