import rateLimit from "express-rate-limit";

/**
 * General API rate limit: generous, applies to every /api route as a
 * baseline abuse guard.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please try again later.",
  },
});

/**
 * Stricter limit specifically for anonymous user creation, since it is the
 * cheapest endpoint to hammer for abuse (no auth, no body).
 */
export const anonymousUserLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please try again later.",
  },
});
