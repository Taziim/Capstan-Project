import { z } from "zod";

/**
 * userId/role are entirely client-supplied over the socket connection.
 * These schemas only guard against malformed/abusive payloads — they do
 * NOT authenticate anyone. See socket.middleware.ts for the security note.
 */
export const roleSchema = z.enum(["user", "agent"], {
  errorMap: () => ({ message: "role must be either 'user' or 'agent'" }),
});

export const userIdSchema = z
  .string({ required_error: "userId is required" })
  .trim()
  .min(3, "userId is too short")
  .max(100, "userId is too long")
  .regex(/^[a-zA-Z0-9_-]+$/, "userId contains invalid characters");

export type Role = z.infer<typeof roleSchema>;
