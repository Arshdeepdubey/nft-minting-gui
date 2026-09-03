import { createHash } from "node:crypto";
import { HttpError } from "../utils/HttpError";
import { User, type UserDocument } from "../models/User";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueTokens(user: UserDocument) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role as "admin" | "user" });
  const refreshToken = signRefreshToken({ sub: user.id });
  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();
  return { accessToken, refreshToken };
}

/** Rotates a refresh token: the old one is invalidated and a new pair is issued. */
export async function rotateRefreshToken(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw HttpError.unauthorized("Invalid or expired refresh token");
  }

  const user = await User.findById(payload.sub);
  if (!user || user.refreshTokenHash !== hashToken(refreshToken)) {
    throw HttpError.unauthorized("Refresh token has been revoked");
  }

  return issueTokens(user);
}

export async function revokeRefreshToken(userId: string) {
  await User.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } });
}
