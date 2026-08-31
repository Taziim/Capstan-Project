import type { Socket } from "socket.io";
import { logger } from "../utils/logger";

/**
 * ⚠️ SECURITY NOTE ⚠️
 * `role` ("user" | "agent") and `userId` are entirely CLIENT-PROVIDED.
 * Nothing in this backend verifies that a socket claiming role "agent" is
 * actually an authorized support agent. This is acceptable ONLY because the
 * spec for this project explicitly calls for an authentication-free,
 * anonymous transport layer. Do NOT treat `role` as a security boundary —
 * anyone can open a WebSocket connection and claim to be an agent.
 * If real agent-only capabilities are ever added, they MUST be protected by
 * a real authentication mechanism (e.g. a signed token issued at login).
 */

const CONNECTION_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_CONNECTIONS_PER_IP = 30; // basic abuse protection against connection floods

const connectionAttempts = new Map<string, { count: number; windowStart: number }>();

function getClientIp(socket: Socket): string {
  return socket.handshake.address || "unknown";
}

function isWithinConnectionLimit(ip: string): boolean {
  const now = Date.now();
  const existing = connectionAttempts.get(ip);

  if (!existing || now - existing.windowStart >= CONNECTION_WINDOW_MS) {
    connectionAttempts.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (existing.count >= MAX_CONNECTIONS_PER_IP) {
    return false;
  }

  existing.count += 1;
  return true;
}

/**
 * Socket.IO connection middleware: basic abuse protection against a single
 * client opening an excessive number of connections in a short window.
 * This runs before `connection`, so rejected sockets never reach handlers.
 */
export function socketConnectionGuard(socket: Socket, next: (err?: Error) => void): void {
  const ip = getClientIp(socket);

  if (!isWithinConnectionLimit(ip)) {
    logger.warn("Socket connection rate limit exceeded", { ip });
    next(new Error("Too many connection attempts. Please try again later."));
    return;
  }

  next();
}
