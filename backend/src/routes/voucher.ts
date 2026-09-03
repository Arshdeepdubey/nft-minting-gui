import type { FastifyInstance, FastifyRequest } from "fastify";
import { requireSession, type SessionPayload } from "../middleware/siweAuth.js";
import { getClaimableVoucher } from "../services/winsService.js";

export async function voucherRoutes(app: FastifyInstance) {
  // Returns the caller's claimable voucher (signed, ready to redeem on-chain).
  app.get(
    "/voucher/claimable",
    { preHandler: requireSession },
    async (req: FastifyRequest, reply) => {
      const { walletAddress } = (req as FastifyRequest & { session: SessionPayload }).session;
      const result = await getClaimableVoucher(walletAddress);
      return reply.send(result);
    }
  );
}
