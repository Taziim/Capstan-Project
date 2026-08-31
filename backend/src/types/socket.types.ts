import type { Role, BroadcastMessage } from "./chat.types";

/** In-memory record of a currently connected client. Never persisted. */
export interface ConnectedUser {
  userId: string;
  role: Role;
}

/** Client -> Server event payloads */
export interface JoinChatPayload {
  userId: string;
  role: Role;
}

export interface SendMessagePayload {
  userId: string;
  role: Role;
  message: string;
}

export interface TypingPayload {
  userId: string;
  role: Role;
}

/** Server -> Client event payloads */
export interface JoinedChatPayload {
  event: "joined_chat";
  room: string;
  userId: string;
}

export interface UserPresencePayload {
  userId: string;
  role: Role;
}

export interface SocketErrorPayload {
  code:
    | "INVALID_PAYLOAD"
    | "NOT_JOINED"
    | "RATE_LIMITED"
    | "MESSAGE_TOO_LONG"
    | "INTERNAL_ERROR";
  message: string;
}

/** Strongly-typed event maps for socket.io's generic Server<C2S, S2C>. */
export interface ClientToServerEvents {
  join_chat: (payload: JoinChatPayload) => void;
  send_message: (payload: SendMessagePayload) => void;
  typing: (payload: TypingPayload) => void;
  stop_typing: (payload: TypingPayload) => void;
  leave_chat: () => void;
}

export interface ServerToClientEvents {
  joined_chat: (payload: JoinedChatPayload) => void;
  message_received: (payload: BroadcastMessage) => void;
  user_joined: (payload: UserPresencePayload) => void;
  user_left: (payload: UserPresencePayload) => void;
  user_typing: (payload: UserPresencePayload) => void;
  user_stop_typing: (payload: UserPresencePayload) => void;
  error: (payload: SocketErrorPayload) => void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface InterServerEvents {}

export interface SocketData {
  /** Populated only after a successful join_chat. */
  connectedUser?: ConnectedUser;
}
