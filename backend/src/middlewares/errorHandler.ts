import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../utils/HttpError";
import { logger } from "../utils/logger";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "ValidationError",
      message: "Request validation failed",
      details: err.flatten(),
    });
  }

  if (err instanceof HttpError) {
    if (err.status >= 500) {
      logger.error({ err, path: req.path }, err.message);
    }
    return res.status(err.status).json({
      error: err.name,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  logger.error({ err, path: req.path }, "Unhandled error");
  return res.status(500).json({ error: "InternalServerError", message: "Something went wrong" });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: "NotFound", message: `No route for ${req.method} ${req.path}` });
}
