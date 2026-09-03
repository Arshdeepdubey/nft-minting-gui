import type { NextFunction, Request, Response } from "express";
import type { AnyZodObject } from "zod";

/** Validates req.body/query/params against Zod schemas, replacing them with the parsed (typed) result. */
export function validate(schemas: {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) req.query = schemas.query.parse(req.query);
      if (schemas.params) req.params = schemas.params.parse(req.params);
      next();
    } catch (err) {
      next(err);
    }
  };
}
