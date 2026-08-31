import type { Server, Socket } from "socket.io";
import { joinChatSchema, sendMessageSchema, typingSchema } from "../validation/chat.validation";
import { generateMessageId } from "../utils/id-generator";
import { logger } from "../utils/logger";
import { SUPPORT_ROOM } from "../types/chat.types";
import {
  addConnectedUser,
  getConnectedUser,
  removeConnectedUser,
} from "./connected-users.store";
import { clearMessageRateLimit, isWithinMessageRateLimit } from "./socket.rate-limiter";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "../types/socket.types";

type AppServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

function hasJoinedRoom(socket: AppSocket): boolean {
  return socket.rooms.has(SUPPORT_ROOM) && Boolean(socket.data.connectedUser);
}

/** Registers every Socket.IO event handler for a single connected socket. */
export function registerSocketHandlers(io: AppServer, socket: AppSocket): void {
  logger.info("Socket connected", { socketId: socket.id });

  socket.on("join_chat", (payload) => {
    const result = joinChatSchema.safeParse(payload);
    if (!result.success) {
      socket.emit("error", {
        code: "INVALID_PAYLOAD",
        message: result.error.issues[0]?.message ?? "Invalid join_chat payload.",
      });
      return;
    }

    const { userId, role } = result.data;

    socket.data.connectedUser = { userId, role };
    addConnectedUser(socket.id, { userId, role });
    socket.join(SUPPORT_ROOM);

    logger.info("User joined chat", { socketId: socket.id, role });

    socket.emit("joined_chat", {
      event: "joined_chat",
      room: SUPPORT_ROOM,
      userId,
    });

    socket.to(SUPPORT_ROOM).emit("user_joined", { userId, role });
  });

  socket.on("send_message", (payload) => {
    if (!hasJoinedRoom(socket)) {
      socket.emit("error", { code: "NOT_JOINED", message: "Join the chat before sending messages." });
      return;
    }

    const result = sendMessageSchema.safeParse(payload);
    if (!result.success) {
      socket.emit("error", {
        code: "INVALID_PAYLOAD",
        message: result.error.issues[0]?.message ?? "Invalid send_message payload.",
      });
      return;
    }

    const data = result.data;

    // Defend against a socket sending a mismatched identity after joining.
    const connectedUser = socket.data.connectedUser!;
    if (data.userId !== connectedUser.userId || data.role !== connectedUser.role) {
      socket.emit("error", { code: "INVALID_PAYLOAD", message: "userId/role does not match the joined session." });
      return;
    }

    if (!isWithinMessageRateLimit(socket.id)) {
      logger.warn("Message rate limit exceeded", { socketId: socket.id });
      socket.emit("error", { code: "RATE_LIMITED", message: "Too many messages. Please try again later." });
      return;
    }

    const broadcastMessage = {
      messageId: generateMessageId(),
      senderId: data.userId,
      senderType: data.role,
      message: data.message,
      createdAt: new Date().toISOString(),
    };

    // Intentionally not logging message content — metadata only.
    logger.info("Message broadcast", { socketId: socket.id, messageId: broadcastMessage.messageId });

    io.to(SUPPORT_ROOM).emit("message_received", broadcastMessage);
    // The message is never stored anywhere beyond this point.
  });

  socket.on("typing", (payload) => {
    if (!hasJoinedRoom(socket)) return;
    const result = typingSchema.safeParse(payload);
    if (!result.success) return;
    socket.to(SUPPORT_ROOM).emit("user_typing", result.data);
  });

  socket.on("stop_typing", (payload) => {
    if (!hasJoinedRoom(socket)) return;
    const result = typingSchema.safeParse(payload);
    if (!result.success) return;
    socket.to(SUPPORT_ROOM).emit("user_stop_typing", result.data);
  });

  socket.on("leave_chat", () => {
    handleLeave(socket);
  });

  socket.on("disconnect", (reason) => {
    logger.info("Socket disconnected", { socketId: socket.id, reason });
    handleLeave(socket);
  });
}

function handleLeave(socket: AppSocket): void {
  const connectedUser = getConnectedUser(socket.id);

  if (connectedUser) {
    socket.to(SUPPORT_ROOM).emit("user_left", connectedUser);
    logger.info("User left chat", { socketId: socket.id, role: connectedUser.role });
  }

  socket.leave(SUPPORT_ROOM);
  removeConnectedUser(socket.id);
  clearMessageRateLimit(socket.id);
  socket.data.connectedUser = undefined;
}
