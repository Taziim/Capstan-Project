import "dotenv/config";
import { z } from "zod";

/**
 * All environment variables are validated once at startup. If a required
 * value is missing or malformed the process fails fast with a clear error
 * instead of crashing later at an unpredictable point.
 */
// Hex colors must be quoted in .env (e.g. CHAT_PRIMARY_COLOR="#2563EB"),
// otherwise dotenv treats the leading "#" as a comment and strips the value.
// Validating the shape here turns that mistake into a loud startup failure
// instead of a silently blank color reaching the frontend.
const hexColor = (fallback: string) =>
  z
    .string()
    .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "must be a hex color like #2563EB (remember to quote it in .env)")
    .default(fallback);

// CLIENT_URL accepts one or more comma-separated origins (trailing slashes and
// surrounding whitespace are stripped) so the same backend can serve a local
// dev frontend, a LAN IP, and a deployed frontend without juggling one value.
const clientUrl = z
  .string()
  .default("http://localhost:5173")
  .transform((value) =>
    value
      .split(",")
      .map((origin) => origin.trim().replace(/\/+$/, ""))
      .filter(Boolean),
  )
  .pipe(z.array(z.string().url()).min(1, "CLIENT_URL must contain at least one valid origin"));

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_URL: clientUrl,
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  CHAT_PRIMARY_COLOR: hexColor("#2563EB"),
  CHAT_SECONDARY_COLOR: hexColor("#EFF6FF"),
  CHAT_USER_MESSAGE_COLOR: hexColor("#2563EB"),
  CHAT_AGENT_MESSAGE_COLOR: hexColor("#F3F4F6"),
  CHAT_TEXT_COLOR: hexColor("#111827"),
  CHAT_BACKGROUND_COLOR: hexColor("#FFFFFF"),
  CHAT_HEADER_COLOR: hexColor("#2563EB"),
  CHAT_HEADER_TEXT_COLOR: hexColor("#FFFFFF"),
  CHAT_INPUT_BACKGROUND_COLOR: hexColor("#FFFFFF"),
  CHAT_BORDER_RADIUS: z.string().default("12px"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === "production";
