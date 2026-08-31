import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, createAnonymousUser, fetchChatConfig } from '../services/api'
import { useSocket } from './useSocket'
import { useToast } from './useToast'
import { getStoredMessages, getStoredUser, storeMessages, storeUser } from '../utils/storage'
import type { ChatConfig, ChatMessage, SocketErrorPayload } from '../types/chat'

export const MAX_MESSAGE_LENGTH = 2000

const FALLBACK_CONFIG: ChatConfig = {
  primaryColor: '#2563EB',
  secondaryColor: '#EFF6FF',
  userMessageColor: '#2563EB',
  agentMessageColor: '#F3F4F6',
  textColor: '#111827',
  backgroundColor: '#FFFFFF',
  headerColor: '#2563EB',
  headerTextColor: '#FFFFFF',
  inputBackgroundColor: '#FFFFFF',
  borderRadius: '12px',
}

const TYPING_IDLE_MS = 2000
const SEND_TIMEOUT_MS = 8000

function makeTempId(): string {
  return `temp_${Math.random().toString(36).slice(2)}_${performance.now()}`
}

// A message still marked pending after a reload was never confirmed by the server
// (sends are fire-and-forget over the socket, with no persistence to recover from).
function settleStaleMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((m) => (m.pending ? { ...m, pending: false, failed: true } : m))
}

export function useChat() {
  const [config, setConfig] = useState<ChatConfig>(FALLBACK_CONFIG)
  const [userId, setUserId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    settleStaleMessages(getStoredMessages()),
  )
  const [isInitializing, setIsInitializing] = useState(true)
  const [agentTyping, setAgentTyping] = useState(false)

  const { socket, connectionState } = useSocket()
  const { toasts, showToast, dismissToast } = useToast()

  const knownMessageIds = useRef<Set<string>>(new Set(messages.map((m) => m.messageId)))
  const isTypingRef = useRef(false)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const agentTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sendTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Persist history any time it changes — this is the only place chat history lives.
  useEffect(() => {
    storeMessages(messages)
  }, [messages])

  const clearSendTimeout = useCallback((tempId: string) => {
    const timeout = sendTimeoutsRef.current.get(tempId)
    if (timeout) {
      clearTimeout(timeout)
      sendTimeoutsRef.current.delete(tempId)
    }
  }, [])

  const reconcileIncomingMessage = useCallback(
    (incoming: ChatMessage) => {
      if (knownMessageIds.current.has(incoming.messageId)) return

      setMessages((current) => {
        if (incoming.senderId === userId) {
          const pendingIndex = current.findIndex(
            (m) => m.pending && m.senderId === userId && m.message === incoming.message,
          )
          if (pendingIndex !== -1) {
            const tempId = current[pendingIndex].messageId
            clearSendTimeout(tempId)
            knownMessageIds.current.delete(tempId)
            knownMessageIds.current.add(incoming.messageId)
            const next = [...current]
            next[pendingIndex] = { ...incoming, pending: false }
            return next
          }
        }
        knownMessageIds.current.add(incoming.messageId)
        return [...current, incoming]
      })
    },
    [userId, clearSendTimeout],
  )

  // Bootstrap: chat theme + anonymous identity. Message history is already loaded
  // synchronously from local storage — there is no history endpoint to wait on.
  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      setIsInitializing(true)
      try {
        const cfg = await fetchChatConfig()
        if (!cancelled) setConfig({ ...FALLBACK_CONFIG, ...cfg.chat })
      } catch {
        if (!cancelled) showToast('Using default chat appearance.', 'info')
      }

      let user = getStoredUser()
      if (!user) {
        try {
          user = await createAnonymousUser()
          storeUser(user)
        } catch (error) {
          if (!cancelled) {
            showToast(
              error instanceof ApiError ? error.message : 'Unable to start chat. Please refresh the page.',
            )
          }
          if (!cancelled) setIsInitializing(false)
          return
        }
      }

      if (!cancelled) {
        setUserId(user.userId)
        setIsInitializing(false)
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Join the shared room once we know who we are and are connected — re-fires on reconnect.
  useEffect(() => {
    if (!userId || connectionState !== 'connected') return
    socket.emit('join_chat', { userId, role: 'user' })
  }, [userId, connectionState, socket])

  // Socket event wiring
  useEffect(() => {
    function handleMessageReceived(message: ChatMessage) {
      reconcileIncomingMessage(message)
    }

    function handleUserTyping() {
      setAgentTyping(true)
      if (agentTypingTimeoutRef.current) clearTimeout(agentTypingTimeoutRef.current)
      agentTypingTimeoutRef.current = setTimeout(() => setAgentTyping(false), 4000)
    }

    function handleUserStopTyping() {
      setAgentTyping(false)
      if (agentTypingTimeoutRef.current) clearTimeout(agentTypingTimeoutRef.current)
    }

    function handleSocketError(payload: SocketErrorPayload) {
      if (payload?.code === 'RATE_LIMITED') {
        showToast(payload.message || "You're sending messages too fast. Please slow down.")
        setMessages((current) => {
          const lastPendingIndex = [...current]
            .map((m, i) => ({ m, i }))
            .filter(({ m }) => m.pending)
            .at(-1)?.i
          if (lastPendingIndex === undefined) return current
          clearSendTimeout(current[lastPendingIndex].messageId)
          const next = [...current]
          next[lastPendingIndex] = { ...next[lastPendingIndex], pending: false, failed: true }
          return next
        })
        return
      }
      showToast(
        payload?.message && payload.message.length < 160 ? payload.message : 'A connection error occurred.',
      )
    }

    socket.on('message_received', handleMessageReceived)
    socket.on('user_typing', handleUserTyping)
    socket.on('user_stop_typing', handleUserStopTyping)
    socket.on('error', handleSocketError)

    return () => {
      socket.off('message_received', handleMessageReceived)
      socket.off('user_typing', handleUserTyping)
      socket.off('user_stop_typing', handleUserStopTyping)
      socket.off('error', handleSocketError)
    }
  }, [socket, reconcileIncomingMessage, showToast, clearSendTimeout])

  useEffect(() => {
    const sendTimeouts = sendTimeoutsRef.current
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      if (agentTypingTimeoutRef.current) clearTimeout(agentTypingTimeoutRef.current)
      sendTimeouts.forEach((timeout) => clearTimeout(timeout))
      sendTimeouts.clear()
    }
  }, [])

  const emitStopTyping = useCallback(() => {
    if (!userId || !isTypingRef.current) return
    isTypingRef.current = false
    socket.emit('stop_typing', { userId, role: 'user' })
  }, [userId, socket])

  const handleTyping = useCallback(() => {
    if (!userId) return
    if (!isTypingRef.current) {
      isTypingRef.current = true
      socket.emit('typing', { userId, role: 'user' })
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(emitStopTyping, TYPING_IDLE_MS)
  }, [userId, socket, emitStopTyping])

  const sendChatMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || !userId) return

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      emitStopTyping()

      const tempId = makeTempId()
      const optimisticMessage: ChatMessage = {
        messageId: tempId,
        senderId: userId,
        senderType: 'user',
        message: trimmed,
        createdAt: new Date().toISOString(),
        pending: true,
      }
      knownMessageIds.current.add(tempId)
      setMessages((current) => [...current, optimisticMessage])

      socket.emit('send_message', { userId, role: 'user', message: trimmed })

      const timeout = setTimeout(() => {
        sendTimeoutsRef.current.delete(tempId)
        setMessages((current) =>
          current.map((m) => (m.messageId === tempId && m.pending ? { ...m, pending: false, failed: true } : m)),
        )
      }, SEND_TIMEOUT_MS)
      sendTimeoutsRef.current.set(tempId, timeout)
    },
    [userId, emitStopTyping, socket],
  )

  return {
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
  }
}
