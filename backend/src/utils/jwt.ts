import jwt from "jsonwebtoken";
import { config } from "../config";

export interface AccessTokenPayload {
  sub: string; // userId
  role: "admin" | "user";
}

export interface RefreshTokenPayload {
  sub: string; // userId
  tokenVersion?: number;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, config.jwt.accessSecret, { expiresIn: config.jwt.accessTtl } as jwt.SignOptions);
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshTtl,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, config.jwt.accessSecret) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as RefreshTokenPayload;
}
