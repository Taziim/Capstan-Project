import type { AnonymousUser, ChatMessage } from '../types/chat'

const USER_ID_KEY = 'chat_user_id'
const MESSAGES_KEY = 'chat_messages'
const MAX_STORED_MESSAGES = 500

export function getStoredUser(): AnonymousUser | null {
  try {
    const userId = localStorage.getItem(USER_ID_KEY)
    if (!userId) return null
    return { userId }
  } catch {
    return null
  }
}

export function storeUser(user: AnonymousUser): void {
  try {
    localStorage.setItem(USER_ID_KEY, user.userId)
  } catch {
    // localStorage unavailable (private browsing, etc.) — chat still works for this tab session
  }
}

export function clearStoredUser(): void {
  try {
    localStorage.removeItem(USER_ID_KEY)
  } catch {
    // ignore
  }
}

export function getStoredMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function storeMessages(messages: ChatMessage[]): void {
  try {
    const trimmed = messages.slice(-MAX_STORED_MESSAGES)
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(trimmed))
  } catch {
    // ignore — history simply won't survive a reload in this browser
  }
}

export function clearStoredMessages(): void {
  try {
    localStorage.removeItem(MESSAGES_KEY)
  } catch {
    // ignore
  }
}
