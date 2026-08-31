import { generateAnonymousUserId } from "../utils/id-generator";

/**
 * Creates a new anonymous user id. Stateless by design: nothing is written
 * to disk, memory, or a database. The frontend owns persistence of this id
 * (e.g. localStorage).
 */
export function createAnonymousUserId(): string {
  return generateAnonymousUserId();
}
