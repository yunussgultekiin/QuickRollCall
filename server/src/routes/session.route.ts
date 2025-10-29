import { NextFunction, Request, Response, Router } from "express";
import { z } from "zod";
import sessionService, { SessionData } from "../cache/session.service";
import { resolveFrontendBase } from "../api/config";
import { validate } from "../middleware/validate.middleware";
import { requireSessionOwner } from "../middleware/owner-auth.middleware";
import { AppError } from "../errors/AppError";

const createBody = z.object({
  name: z.string().min(1).optional(),
  durationMinutes: z.coerce.number().int().positive().optional(),
});

const sessionParamsSchema = z.object({ sessionId: z.string().min(1) });

/**
 * @swagger
 * /api/sessions:
 *   post:
 *     summary: Start a new polling session
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SessionCreateRequest'
 *     responses:
 *       201:
 *         description: Session created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SessionCreateResponse'
 *       404:
 *         description: Token issuance failed after session creation.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericErrorResponse'
 *
 * /api/sessions/{sessionId}:
 *   get:
 *     summary: Get session by id
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session data returned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SessionDetailResponse'
 *       404:
 *         description: Session not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericErrorResponse'
 *
 * /api/sessions/{sessionId}/close:
 *   post:
 *     summary: Close session
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session closed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SessionCloseResponse'
 *       404:
 *         description: Session not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericErrorResponse'
 *
 * /api/sessions/{sessionId}/token:
 *   post:
 *     summary: Issue a single-use attendance token
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Token issued successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SessionTokenResponse'
 *       404:
 *         description: Session not found or inactive.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericErrorResponse'
 */

class SessionController {
  public readonly router = Router();

  constructor() {
    this.router.post("/", validate({ body: createBody }), this.createSession);

    this.router.get(
      "/:sessionId",
      validate({ params: sessionParamsSchema }),
      requireSessionOwner,
      this.getSession,
    );

    this.router.post(
      "/:sessionId/close",
      validate({ params: sessionParamsSchema }),
      requireSessionOwner,
      this.closeSession,
    );

    this.router.post(
      "/:sessionId/token",
      validate({ params: sessionParamsSchema }),
      requireSessionOwner,
      this.issueToken,
    );
  }

  private createSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, durationMinutes } = req.body as z.infer<typeof createBody>;
      const { session, instructorUrl } = await sessionService.createSession({ name, durationMinutes });
      const token = await sessionService.issueAttendanceToken(session.id);
      if (!token) {
        throw new AppError("Token could not be generated", {
          status: 404,
          body: { success: false, message: "Token could not be generated" },
        });
      }

      const base = resolveFrontendBase(req);
      const attendUrl = `${base}/attend/${session.id}?token=${encodeURIComponent(token)}`;
      res.status(201).json({
        sessionId: session.id,
        isActive: session.isActive,
        instructorUrl,
        attendUrl,
        name: session.name,
        durationMinutes: session.durationMinutes,
        token,
        ownerToken: session.ownerToken,
      });
    } catch (err) {
      next(err);
    }
  };

  private getSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await sessionService.getSession(req.params.sessionId);
      if (!session) {
        throw new AppError("Session not found", {
          status: 404,
          body: { success: false, message: "Session not found" },
        });
      }
      const { tokens, ownerToken, ...safe } = session as SessionData & { ownerToken: string };
      res.json({ ...safe, tokensCount: tokens.length });
    } catch (err) {
      next(err);
    }
  };

  private closeSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await sessionService.closeSession(req.params.sessionId);
      if (!session) {
        throw new AppError("Session not found", {
          status: 404,
          body: { success: false, message: "Session not found" },
        });
      }
      res.json({ success: true, session });
    } catch (err) {
      next(err);
    }
  };

  private issueToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = await sessionService.issueAttendanceToken(req.params.sessionId);
      if (!token) {
        throw new AppError("Session not found or inactive", {
          status: 404,
          body: { success: false, message: "Session not found or inactive" },
        });
      }
      const base = resolveFrontendBase(req);
      const attendUrl = `${base}/attend/${req.params.sessionId}?token=${encodeURIComponent(token)}`;
      res.json({ success: true, token, attendUrl });
    } catch (err) {
      next(err);
    }
  };
}

const sessionController = new SessionController();
export const sessionRouter = sessionController.router;
export default sessionController.router;
