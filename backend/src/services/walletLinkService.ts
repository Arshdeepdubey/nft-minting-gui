import { randomBytes } from "node:crypto";
import { verifyMessage } from "ethers";
import { HttpError } from "../utils/HttpError";
import { User, type UserDocument } from "../models/User";

/** Generates and stores a fresh wallet-link nonce for the given user. */
export async function createWalletLinkNonce(userId: string): Promise<{ nonce: string; message: string }> {
  const nonce = randomBytes(16).toString("hex");
  await User.findByIdAndUpdate(userId, { walletNonce: nonce });
  const message = buildNonceMessage(nonce);
  return { nonce, message };
}

export function buildNonceMessage(nonce: string): string {
  return `Sign this message to link your wallet to your nft-minting-gui account.\n\nNonce: ${nonce}`;
}

/** Verifies a signed nonce message and links the recovered address to the user. */
export async function verifyAndLinkWallet(
  userId: string,
  walletAddress: string,
  signature: string
): Promise<UserDocument> {
  const user = await User.findById(userId);
  if (!user) {
    throw HttpError.notFound("User not found");
  }
  if (!user.walletNonce) {
    throw HttpError.badRequest("No pending wallet-link nonce; request a new one");
  }

  const message = buildNonceMessage(user.walletNonce);
  let recovered: string;
  try {
    recovered = verifyMessage(message, signature);
  } catch {
    throw HttpError.badRequest("Invalid signature");
  }

  if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
    throw HttpError.badRequest("Signature does not match wallet address");
  }

  const existing = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
  if (existing && existing.id !== user.id) {
    throw HttpError.conflict("Wallet is already linked to another account");
  }

  user.walletAddress = walletAddress.toLowerCase();
  user.walletNonce = undefined;
  await user.save();
  return user;
}
