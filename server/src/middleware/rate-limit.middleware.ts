import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../cache/redis.client';
import logger from './logger.middleware';

export type RateLimitOptions = {
  windowSec: number;
  max: number;
  keyPrefix?: string;
  getKey?: (req: Request) => string | null;
};

function defaultKeyExtractor(req: Request): string | null {
  const sessionId = req.params.sessionId;
  if (!sessionId) return null;
  const rawHeader = req.headers['x-client-id'];
  const clientId = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
  if (clientId && clientId.trim()) {
    return `${sessionId}:${clientId.trim()}`;
  }
  const ip = (req.ip || '').trim();
  if (ip) {
    return `${sessionId}:ip:${ip}`;
  }
  return null;
}

export function rateLimit(opts: RateLimitOptions) {
  const windowSec = Math.max(1, Math.floor(opts.windowSec));
  const max = Math.max(1, Math.floor(opts.max));
  const prefix = opts.keyPrefix || 'rl';
  const keyExtractor = opts.getKey || defaultKeyExtractor;
  const windowMs = windowSec * 1000;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const keyTail = keyExtractor(req);
      if (!keyTail) return next();
      const key = `${prefix}:${keyTail}`;
      const now = Date.now();
      const windowStart = now - windowMs;

      const rc = await getRedisClient();
      const zkey = `${key}:z`; 

      await rc.zRemRangeByScore(zkey, 0, windowStart);
      await rc.zAdd(zkey, [{ score: now, value: String(now) }]);
      const count = await rc.zCard(zkey);
      await rc.expire(zkey, windowSec + 5);

      let resetSeconds = windowSec;
      try {
        const oldest = await rc.zRangeWithScores(zkey, 0, 0);
        if (oldest.length) {
          const oldestTs = Number(oldest[0].score);
          resetSeconds = Math.max(0, Math.ceil((oldestTs + windowMs - now) / 1000));
        }
      } catch (innerErr) {
        logger.debug?.(`Rate limit reset calculation failed: ${(innerErr as Error).message}`);
      }

      res.setHeader('X-RateLimit-Limit', String(max));
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - count)));
      res.setHeader('X-RateLimit-Reset', String(resetSeconds));

      if (count > max) {
        return res.status(429).json({ success: false, message: 'Too many requests, please slow down.' });
      }

      next();
    } catch (e) {
      logger.warn(`Rate limit check failed; allowing request to continue. ${(e as Error).message}`);
      next();
    }
  };
}
