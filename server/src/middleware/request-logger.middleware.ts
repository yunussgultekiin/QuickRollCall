import { Request, Response, NextFunction } from "express";
import logger from "./logger.middleware";
import { config } from "../api/config";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();
  const { method, url } = req;

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const msg = `${method} ${url} ${res.statusCode} - ${durationMs.toFixed(1)}ms`;

    if (res.statusCode >= 500) {
      logger.error(msg);
      return;
    }

    if (res.statusCode >= 400) {
      logger.warn(msg);
      return;
    }

    if (config.isProd) {
      logger.debug(msg);
      return;
    }

    logger.info(msg);
  });

  next();
}
