import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import passport from "passport";
import { config } from "./config";
import { logger } from "./utils/logger";
import { connectMongo } from "./db/mongoose";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import userRoutes from "./routes/user";

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.frontendUrl, credentials: true }));
  app.use(express.json());
  app.use(pinoHttp({ logger }));
  app.use(rateLimit({ windowMs: config.rateLimit.windowMs, max: config.rateLimit.max }));
  app.use(passport.initialize());

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/auth", authRoutes);
  app.use("/admin", adminRoutes);
  app.use("/user", userRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

async function main() {
  await connectMongo();
  const app = createApp();
  app.listen(config.port, () => {
    logger.info(`Backend listening on http://localhost:${config.port}`);
  });
}

if (require.main === module) {
  main().catch((err) => {
    logger.error({ err }, "Failed to start server");
    process.exit(1);
  });
}
