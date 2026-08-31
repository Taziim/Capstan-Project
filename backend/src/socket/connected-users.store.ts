import type { ConnectedUser } from "../types/socket.types";

/**
 * The ONLY server-side state in this application: a temporary, in-memory
 * map of currently connected sockets to their client-declared identity.
 *
 * - Keyed by socket.id
 * - Never written to disk or any external store
 * - Entries are removed on disconnect and lost entirely on server restart
 */
const connectedUsers = new Map<string, ConnectedUser>();

export function addConnectedUser(socketId: string, user: ConnectedUser): void {
  connectedUsers.set(socketId, user);
}

export function getConnectedUser(socketId: string): ConnectedUser | undefined {
  return connectedUsers.get(socketId);
}

export function removeConnectedUser(socketId: string): void {
  connectedUsers.delete(socketId);
}

export function getConnectedUserCount(): number {
  return connectedUsers.size;
}
