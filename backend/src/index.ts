import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { authRoutes } from "./routes/auth.js";
import { voucherRoutes } from "./routes/voucher.js";
import { internalRoutes } from "./routes/internal.js";

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: config.siweOrigin,
    credentials: true,
  });

  app.get("/health", async () => ({ status: "ok" }));

  await app.register(authRoutes);
  await app.register(voucherRoutes);
  await app.register(internalRoutes);

  await app.listen({ port: config.port, host: "0.0.0.0" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
