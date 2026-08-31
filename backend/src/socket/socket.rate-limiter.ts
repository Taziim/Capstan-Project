/**
 * Fixed-window, in-memory rate limiter for Socket.IO messages.
 * Limits each socket to MAX_MESSAGES within WINDOW_MS. State is purely
 * in-memory and is discarded when the socket disconnects.
 */

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_MESSAGES = 20; // 20 messages per minute per socket

interface Window {
  count: number;
  windowStart: number;
}

const windows = new Map<string, Window>();

/** Returns true if the socket is allowed to send another message right now. */
export function isWithinMessageRateLimit(socketId: string): boolean {
  const now = Date.now();
  const existing = windows.get(socketId);

  if (!existing || now - existing.windowStart >= WINDOW_MS) {
    windows.set(socketId, { count: 1, windowStart: now });
    return true;
  }

  if (existing.count >= MAX_MESSAGES) {
    return false;
  }

  existing.count += 1;
  return true;
}

/** Must be called on disconnect to avoid unbounded memory growth. */
export function clearMessageRateLimit(socketId: string): void {
  windows.delete(socketId);
}
