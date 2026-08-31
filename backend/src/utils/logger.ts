import { isProduction } from "../config/env";

type LogFields = Record<string, unknown>;

function timestamp(): string {
  return new Date().toISOString();
}

function format(level: string, message: string, fields?: LogFields): string {
  const base = `[${timestamp()}] [${level}] ${message}`;
  if (!fields || Object.keys(fields).length === 0) return base;
  return `${base} ${JSON.stringify(fields)}`;
}

/**
 * Minimal structured logger. In production, callers must NOT pass raw
 * chat message content in `fields` — only metadata (ids, roles, counts).
 */
export const logger = {
  info(message: string, fields?: LogFields): void {
    // eslint-disable-next-line no-console
    console.log(format("INFO", message, fields));
  },
  warn(message: string, fields?: LogFields): void {
    // eslint-disable-next-line no-console
    console.warn(format("WARN", message, fields));
  },
  error(message: string, error?: unknown, fields?: LogFields): void {
    const errorFields =
      error instanceof Error
        ? { ...fields, error: error.message, stack: isProduction ? undefined : error.stack }
        : fields;
    // eslint-disable-next-line no-console
    console.error(format("ERROR", message, errorFields));
  },
};
