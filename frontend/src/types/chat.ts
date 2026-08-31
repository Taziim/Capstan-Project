export interface AnonymousUser {
  userId: string
}

export type MessageRole = 'user' | 'agent'

export interface ChatMessage {
  messageId: string
  senderId: string
  senderType: MessageRole
  message: string
  createdAt: string
  pending?: boolean
  failed?: boolean
}

export interface ChatConfig {
  primaryColor: string
  secondaryColor: string
  userMessageColor: string
  agentMessageColor: string
  textColor: string
  backgroundColor: string
  headerColor: string
  headerTextColor: string
  inputBackgroundColor: string
  borderRadius: string
}

export interface ChatConfigResponse {
  chat: ChatConfig
}

export type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

export type SocketErrorCode =
  | 'INVALID_PAYLOAD'
  | 'NOT_JOINED'
  | 'RATE_LIMITED'
  | 'MESSAGE_TOO_LONG'
  | 'INTERNAL_ERROR'

export interface SocketErrorPayload {
  code: SocketErrorCode
  message: string
}
