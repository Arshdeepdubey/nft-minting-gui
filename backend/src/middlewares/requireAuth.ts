import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/HttpError";
import { verifyAccessToken } from "../utils/jwt";

declare module "express-serve-static-core" {
  interface Request {
    user?: { id: string; role: "admin" | "user" };
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(HttpError.unauthorized("Missing bearer token"));
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(HttpError.unauthorized("Invalid or expired token"));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(HttpError.unauthorized());
  }
  if (req.user.role !== "admin") {
    return next(HttpError.forbidden("Admin role required"));
  }
  next();
}
