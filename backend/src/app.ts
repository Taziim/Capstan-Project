import express, { type Application } from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { apiLimiter } from "./middleware/rate-limit.middleware";
import { notFoundMiddleware } from "./middleware/not-found.middleware";
import { errorMiddleware } from "./middleware/error.middleware";
import anonymousUserRoutes from "./routes/anonymous-user.routes";
import chatConfigRoutes from "./routes/chat-config.routes";
import healthRoutes from "./routes/health.routes";

export function createApp(): Application {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_URL,
      methods: ["GET", "POST"],
    }),
  );
  app.use(express.json({ limit: "10kb" }));

  app.use("/api", apiLimiter);

  app.use("/api", healthRoutes);
  app.use("/api/users", anonymousUserRoutes);
  app.use("/api/config", chatConfigRoutes);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
