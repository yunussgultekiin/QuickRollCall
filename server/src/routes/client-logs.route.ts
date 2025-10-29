import { Request, Response, Router } from "express";
import { z } from "zod";
import logger from "../middleware/logger.middleware";
import { AppError } from "../errors/AppError";

const levelSchema = z.enum(["debug", "info", "warn", "error"]);
const logSchema = z.object({
  level: levelSchema,
  message: z.string().min(1).max(2000),
  meta: z.record(z.string(), z.unknown()).optional(),
});

/**
 * @swagger
 * /api/logs:
 *   post:
 *     summary: Receive frontend logs
 *     description: Forwards client-side logs to server console; logs are not persisted.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClientLogRequest'
 *     responses:
 *       200:
 *         description: Logged successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClientLogResponse'
 *       400:
 *         description: Invalid log payload.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericErrorResponse'
 */
class ClientLogsController {
  public readonly router = Router();

  constructor() {
    this.router.post("/", this.forwardLog);
  }

  private forwardLog = (req: Request, res: Response) => {
    const parse = logSchema.safeParse(req.body);
    if (!parse.success) {
      throw new AppError("Invalid log payload", {
        status: 400,
        body: { success: false, message: "Invalid log payload" },
      });
    }
    const { level, message, meta } = parse.data;
    const prefix = "[client]";
    let metaStr = "";
    if (meta) {
      try {
        metaStr = " " + JSON.stringify(meta);
      } catch {
        metaStr = " [meta unserializable]";
      }
    }
    (logger[level] as (...args: any[]) => void)(`${prefix} ${message}${metaStr}`);
    return res.json({ success: true });
  };
}

const clientLogsController = new ClientLogsController();
export const clientLogsRouter = clientLogsController.router;
export default clientLogsController.router;