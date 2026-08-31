import { env } from "./env";
import type { ChatConfig } from "../types/chat.types";

/**
 * Builds the chat UI theme payload served by GET /api/config/chat.
 * Every value comes from environment variables — never hard-coded here or
 * in the frontend.
 */
export function getChatConfig(): ChatConfig {
  return {
    primaryColor: env.CHAT_PRIMARY_COLOR,
    secondaryColor: env.CHAT_SECONDARY_COLOR,
    userMessageColor: env.CHAT_USER_MESSAGE_COLOR,
    agentMessageColor: env.CHAT_AGENT_MESSAGE_COLOR,
    textColor: env.CHAT_TEXT_COLOR,
    backgroundColor: env.CHAT_BACKGROUND_COLOR,
    headerColor: env.CHAT_HEADER_COLOR,
    headerTextColor: env.CHAT_HEADER_TEXT_COLOR,
    inputBackgroundColor: env.CHAT_INPUT_BACKGROUND_COLOR,
    borderRadius: env.CHAT_BORDER_RADIUS,
  };
}
