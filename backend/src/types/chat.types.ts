/**
 * Shared domain types for the single-room, storage-less chat transport.
 */

/** Client-declared role. This is NOT authentication — see socket.middleware.ts. */
export type Role = "user" | "agent";

/** The one and only Socket.IO room every client joins. */
export const SUPPORT_ROOM = "support-room" as const;

/** Shape of a chat message the moment it is broadcast. Never persisted. */
export interface BroadcastMessage {
  messageId: string;
  senderId: string;
  senderType: Role;
  message: string;
  createdAt: string;
}

/** Chat UI theme, sourced entirely from environment variables. */
export interface ChatConfig {
  primaryColor: string;
  secondaryColor: string;
  userMessageColor: string;
  agentMessageColor: string;
  textColor: string;
  backgroundColor: string;
  headerColor: string;
  headerTextColor: string;
  inputBackgroundColor: string;
  borderRadius: string;
}
