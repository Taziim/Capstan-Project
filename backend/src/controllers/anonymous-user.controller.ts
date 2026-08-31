import type { Request, Response } from "express";
import { createAnonymousUserId } from "../services/anonymous-user.service";

/**
 * POST /api/users/anonymous
 * Generates and returns a new anonymous user id. No database operation,
 * no server-side record of the id is kept.
 */
export function createAnonymousUser(_req: Request, res: Response): void {
  const userId = createAnonymousUserId();
  res.status(201).json({ userId });
}
