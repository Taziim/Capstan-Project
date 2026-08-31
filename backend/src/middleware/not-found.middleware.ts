import type { Request, Response } from "express";

/** Catches any request that didn't match a defined route. */
export function notFoundMiddleware(req: Request, res: Response): void {
  res.status(404).json({
    error: "NOT_FOUND",
    message: `Route ${req.method} ${req.originalUrl} does not exist.`,
  });
}
