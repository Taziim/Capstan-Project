import { randomUUID } from "crypto";

/** Cryptographically secure anonymous user id. Never stored by the backend. */
export function generateAnonymousUserId(): string {
  return `anonymous_${randomUUID()}`;
}

/** Cryptographically secure, temporary message id. Exists only for the
 * duration of one broadcast — used by the frontend for de-duplication. */
export function generateMessageId(): string {
  return `msg_${randomUUID()}`;
}
