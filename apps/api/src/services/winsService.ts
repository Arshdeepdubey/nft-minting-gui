import { randomInt } from "crypto";
import { prisma } from "../db/prismaClient.js";
import { signVoucher } from "./voucherSigner.js";
import type { ClaimableVoucherResponse } from "@nft-minting-gui/shared";

/**
 * Returns the claimable voucher for a wallet's most recent, unredeemed win.
 * If a voucher was already signed for that win, it's reused (idempotent);
 * otherwise a new tokenId is minted and signed on the fly.
 */
export async function getClaimableVoucher(
  walletAddress: string
): Promise<ClaimableVoucherResponse> {
  const address = walletAddress.toLowerCase();

  const win = await prisma.win.findFirst({
    where: {
      walletAddress: address,
      voucher: { is: { redeemedAt: null } },
    },
    orderBy: { wonAt: "desc" },
    include: { voucher: true },
  });

  if (!win) {
    return { claimable: false, reason: "No unclaimed wins for this wallet." };
  }

  if (win.voucher) {
    return {
      claimable: true,
      voucher: {
        tokenId: win.voucher.tokenId,
        recipient: win.voucher.recipient,
        uri: win.voucher.uri,
        expiresAt: win.voucher.expiresAt
          ? Math.floor(win.voucher.expiresAt.getTime() / 1000)
          : 0,
        signature: win.voucher.signature,
      },
    };
  }

  // First time this win is being turned into a voucher: mint a tokenId,
  // sign it, and persist so future requests are idempotent.
  const tokenId = String(Date.now()) + String(randomInt(1000, 9999));
  const uri = `ipfs://METADATA_CID_PLACEHOLDER/${tokenId}.json`;
  const expiresAt = 0; // no expiry; set a unix timestamp to add one

  const signed = await signVoucher({ tokenId, recipient: address, uri, expiresAt });

  await prisma.voucher.create({
    data: {
      tokenId: signed.tokenId,
      recipient: signed.recipient,
      uri: signed.uri,
      expiresAt: expiresAt ? new Date(expiresAt * 1000) : null,
      signature: signed.signature,
      winId: win.id,
    },
  });

  return { claimable: true, voucher: signed };
}

/** Call this from your webhook/event handler when a user wins something. */
export async function recordWin(walletAddress: string, competitionName: string) {
  return prisma.win.create({
    data: {
      walletAddress: walletAddress.toLowerCase(),
      competitionName,
    },
  });
}

/** Mark a voucher redeemed once you observe the on-chain VoucherRedeemed event. */
export async function markVoucherRedeemed(tokenId: string) {
  return prisma.voucher.update({
    where: { tokenId },
    data: { redeemedAt: new Date() },
  });
}
