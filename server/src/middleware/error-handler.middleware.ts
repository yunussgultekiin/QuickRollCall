import { Request, Response, NextFunction } from "express";
import logger from "./logger.middleware";
import { config } from "../api/config";
import { AppError, isAppError } from "../errors/AppError";

type HttpishError = Error & { status?: number; statusCode?: number; code?: string };

export function errorHandler(
  err: HttpishError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const status = isAppError(err) ? err.status : err.status ?? err.statusCode ?? 500;

  const logPayload = {
    requestId: res.locals.requestId,
  };
  const message = `${req.method} ${req.url} -> ${status}: ${err.message}`;
  if (status >= 500) {
    logger.error(message, logPayload);
  } else if (status >= 400) {
    logger.warn(message, logPayload);
  } else {
    logger.info(message, logPayload);
  }

  if (res.headersSent) {
    return next(err);
  }

  const body: Record<string, unknown> = isAppError(err) && err.body
    ? { ...err.body }
    : {
        success: false,
        message:
          config.isProd && status >= 500
            ? "Internal Server Error"
            : err.message,
      };

  if (isAppError(err) && err.code) {
    body.code = err.code;
  }

  if (!config.isProd) {
    (body as any).stack = err.stack;
    if (!isAppError(err) && (err as any).code) {
      (body as any).code = (err as any).code;
    }
    if (isAppError(err) && typeof err.details !== "undefined") {
      (body as any).details = err.details;
    }
  }

  res.status(status).json(body);
}