import { NextFunction, Request, Response } from "express";
import type { ZodError, ZodIssue, ZodSchema } from "zod";

type Schemas = {
  body?: ZodSchema<any>;
  params?: ZodSchema<any>;
  query?: ZodSchema<any>;
};

export function validate(schemas: Schemas) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.params) {
        const parsed = schemas.params.parse(req.params);
        Object.assign(req.params as any, parsed);
      }
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query);
        Object.assign(req.query as any, parsed);
      }
      if (schemas.body) {
        const bodyInput = req.body === undefined || req.body === null ? {} : req.body;
        const parsed = schemas.body.parse(bodyInput);
        if (typeof req.body === 'object' && req.body !== null) {
          Object.assign(req.body as any, parsed);
        } else {
          (req as any).body = parsed;
        }
      }
      next();
    } catch (err) {
      if ((err as any)?.issues && (err as any).name === 'ZodError') {
        const zerr = err as unknown as ZodError<any>;
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: (zerr.issues as ZodIssue[]).map((e: ZodIssue) => ({
            path: e.path.join("."),
            message: e.message,
            code: e.code,
          })),
        });
      }
      next(err as any);
    }
  };
}
