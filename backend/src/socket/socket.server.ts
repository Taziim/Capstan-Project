import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { socketConnectionGuard } from "./socket.middleware";
import { registerSocketHandlers } from "./socket.handlers";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "../types/socket.types";

const MAX_PAYLOAD_BYTES = 64 * 1024; // 64kb — comfortably above a 2000-char message, well below abuse territory

export type AppIoServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

/** Creates and wires up the single Socket.IO server used by this app. */
export function createSocketServer(httpServer: HttpServer): AppIoServer {
  const io: AppIoServer = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ["GET", "POST"],
    },
    maxHttpBufferSize: MAX_PAYLOAD_BYTES,
  });

  io.use(socketConnectionGuard);

  io.on("connection", (socket) => {
    registerSocketHandlers(io, socket);
  });

  logger.info("Socket.IO server initialized", { room: "support-room" });

  return io;
}
