import type { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

export interface SessionPayload {
  walletAddress: string;
}

export function issueSessionToken(walletAddress: string): string {
  return jwt.sign({ walletAddress: walletAddress.toLowerCase() }, config.jwtSecret, {
    expiresIn: "12h",
  });
}

/** Fastify preHandler: requires a valid session JWT (set after SIWE verify). */
export async function requireSession(req: FastifyRequest, reply: FastifyReply) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return reply.code(401).send({ error: "Missing session token" });
  }

  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret) as SessionPayload;
    (req as FastifyRequest & { session: SessionPayload }).session = payload;
  } catch {
    return reply.code(401).send({ error: "Invalid or expired session" });
  }
}
