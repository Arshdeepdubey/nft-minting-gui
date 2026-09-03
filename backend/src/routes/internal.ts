import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { recordWin } from "../services/winsService.js";

const recordWinSchema = z.object({
  walletAddress: z.string(),
  competitionName: z.string(),
});

/**
 * Internal-only endpoint for your game/platform backend to call when a user wins.
 * Protect this behind a reverse-proxy allowlist or a shared-secret header
 * in production — it is intentionally not exposed to end users.
 */
export async function internalRoutes(app: FastifyInstance) {
  app.post("/internal/wins", async (req, reply) => {
    const parsed = recordWinSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid request body" });
    }
    const win = await recordWin(parsed.data.walletAddress, parsed.data.competitionName);
    return reply.code(201).send(win);
  });
}
