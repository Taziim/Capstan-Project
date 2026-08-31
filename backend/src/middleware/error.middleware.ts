import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../utils/logger";

/**
 * Centralized error handler. Never leaks stack traces or internal details
 * to the client, regardless of environment.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorMiddleware(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Invalid request payload.",
      issues: err.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    });
    return;
  }

  logger.error("Unhandled request error", err, { path: req.originalUrl, method: req.method });

  res.status(500).json({
    error: "INTERNAL_SERVER_ERROR",
    message: "Something went wrong. Please try again later.",
  });
}
