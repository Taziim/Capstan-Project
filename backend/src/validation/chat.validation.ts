import { z } from "zod";
import { roleSchema, userIdSchema } from "./user.validation";

/** Maximum characters allowed in a single chat message. */
export const MAX_MESSAGE_LENGTH = 2000;

export const joinChatSchema = z.object({
  userId: userIdSchema,
  role: roleSchema,
});

export const sendMessageSchema = z.object({
  userId: userIdSchema,
  role: roleSchema,
  message: z
    .string({ required_error: "message is required" })
    .trim()
    .min(1, "message cannot be empty")
    .max(MAX_MESSAGE_LENGTH, `message cannot exceed ${MAX_MESSAGE_LENGTH} characters`),
});

export const typingSchema = z.object({
  userId: userIdSchema,
  role: roleSchema,
});

export type JoinChatInput = z.infer<typeof joinChatSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type TypingInput = z.infer<typeof typingSchema>;
