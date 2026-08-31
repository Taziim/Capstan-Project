import http from "http";
import { createApp } from "./app";
import { createSocketServer } from "./socket/socket.server";
import { env } from "./config/env";
import { logger } from "./utils/logger";

const app = createApp();
const httpServer = http.createServer(app);
const io = createSocketServer(httpServer);

httpServer.listen(env.PORT, () => {
  logger.info(`Server listening on port ${env.PORT}`, {
    env: env.NODE_ENV,
    clientUrl: env.CLIENT_URL,
  });
});

let shuttingDown = false;

function shutdown(signal: string): void {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info(`Received ${signal}, shutting down gracefully...`);

  io.close(() => {
    logger.info("Socket.IO server closed");
  });

  httpServer.close((err) => {
    if (err) {
      logger.error("Error during HTTP server shutdown", err);
      process.exit(1);
    }
    logger.info("HTTP server closed. Goodbye.");
    process.exit(0);
  });

  // Safety net in case connections hang and never let close() callbacks fire.
  setTimeout(() => {
    logger.warn("Forcing shutdown after timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
