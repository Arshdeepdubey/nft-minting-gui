import type { FastifyInstance } from "fastify";
import { SiweMessage, generateNonce } from "siwe";
import { z } from "zod";
import { issueSessionToken } from "../middleware/siweAuth.js";
import { config } from "../config.js";

// In-memory nonce store keyed by nonce. Swap for Redis in production
// so nonces survive restarts and work across multiple API instances.
const nonces = new Set<string>();

const verifyBodySchema = z.object({
  message: z.string(),
  signature: z.string(),
});

export async function authRoutes(app: FastifyInstance) {
  // 1. Frontend requests a nonce before prompting the wallet to sign.
  app.get("/auth/nonce", async (_req, reply) => {
    const nonce = generateNonce();
    nonces.add(nonce);
    return reply.send({ nonce });
  });

  // 2. Frontend submits the SIWE message + wallet signature for verification.
  app.post("/auth/verify", async (req, reply) => {
    const parsed = verifyBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid request body" });
    }

    const { message, signature } = parsed.data;
    const siweMessage = new SiweMessage(message);

    try {
      const result = await siweMessage.verify({
        signature,
        domain: config.siweDomain,
      });

      if (!nonces.has(result.data.nonce)) {
        return reply.code(401).send({ error: "Unknown or reused nonce" });
      }
      nonces.delete(result.data.nonce);

      const token = issueSessionToken(result.data.address);
      return reply.send({ token, walletAddress: result.data.address });
    } catch (err) {
      req.log.error(err);
      return reply.code(401).send({ error: "SIWE verification failed" });
    }
  });
}
