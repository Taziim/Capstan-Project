import type { Request, Response } from "express";
import { getChatConfig } from "../config/chat.config";

/**
 * GET /api/config/chat
 * Returns the chat UI theme, sourced from environment variables.
 */
export function getChatConfiguration(_req: Request, res: Response): void {
  res.status(200).json({ chat: getChatConfig() });
}
