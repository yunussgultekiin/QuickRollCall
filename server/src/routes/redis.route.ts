import { Request, Response, Router } from "express";
import { isRedisActive } from "../cache/redis.client";
import { getRedisEndpointPretty } from "../api/config";

/**
 * @swagger
 * /api/redis/status:
 *   get:
 *     summary: Redis status
 *     description: Performs a health-check PING against the configured Redis instance.
 *     responses:
 *       200:
 *         description: Redis is reachable.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RedisStatusResponse'
 *       503:
 *         description: Redis not reachable.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RedisStatusResponse'
 */
class RedisController {
  public readonly router = Router();

  constructor() {
    this.router.get("/status", this.getStatus);
  }

  private getStatus = async (_req: Request, res: Response) => {
    const status = await isRedisActive();
    res.status(status.active ? 200 : 503).json({
      active: status.active,
      endpoint: getRedisEndpointPretty(),
      error: status.error,
    });
  };
}

const redisController = new RedisController();
export const redisRouter = redisController.router;
export default redisController.router;