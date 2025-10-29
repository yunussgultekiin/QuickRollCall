import { NextFunction, Request, Response, Router } from "express";
import { z } from "zod";
import sessionService from "../cache/session.service";
import { resolveFrontendBase } from "../api/config";
import { validate } from "../middleware/validate.middleware";
import {
  attendanceSubmissionSchema,
  sessionIdParamSchema,
  tokenValidateQuerySchema,
} from "../validation/attendance.schema";
import { submitLimiter, mintLimiter } from "../middleware/rate-limit-presets";
import { AppError } from "../errors/AppError";

type Reason =
  | "SESSION_NOT_FOUND"
  | "SESSION_CLOSED"
  | "TOKEN_INVALID"
  | "DUPLICATE_ATTENDANCE"
  | "DUPLICATE_DEVICE_SUBMISSION";

const attendanceParamsSchema = sessionIdParamSchema;
const attendanceBodySchema = attendanceSubmissionSchema;
const validateQuerySchema = tokenValidateQuerySchema;

/**
 * @swagger
 * /api/attendance/{sessionId}:
 *   post:
 *     summary: Submit attendance for a session
 *     description: Consumes a single-use token; on success the token becomes invalid for future submissions.
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique session identifier.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AttendanceSubmissionRequest'
 *     responses:
 *       200:
 *         description: Attendance recorded successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AttendanceSubmissionSuccessResponse'
 *       400:
 *         description: Validation error, session closed, invalid token, or duplicate submission.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AttendanceSubmissionErrorResponse'
 *       404:
 *         description: Session does not exist.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AttendanceSubmissionErrorResponse'
 */

/**
 * @swagger
 * /api/attendance/{sessionId}/validate:
 *   get:
 *     summary: Validate an attendance token for a session (does not consume the token)
 *     description: Returns lightweight session data so the client can identify the session before submitting attendance.
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique session identifier.
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Single-use attendance token to validate.
 *     responses:
 *       200:
 *         description: Token is valid for the active session.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenValidationSuccessResponse'
 *       400:
 *         description: Session closed or token invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenValidationErrorResponse'
 *       404:
 *         description: Session not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenValidationErrorResponse'
 */

/**
 * @swagger
 * /api/attendance/{sessionId}/token:
 *   post:
 *     summary: Issue a single-use attendance token (public minting)
 *     description: Provides a token if the session exists and is active.
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Token minted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MintTokenSuccessResponse'
 *       400:
 *         description: Session exists but is closed.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericErrorResponse'
 *       404:
 *         description: Session not found or token generation failed.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericErrorResponse'
 */

class AttendanceController {
  public readonly router = Router();

  private readonly rejectionMessages: Record<Reason, string> = {
    SESSION_NOT_FOUND: "Session not found",
    SESSION_CLOSED: "Session is closed",
    TOKEN_INVALID: "Invalid or already used token",
    DUPLICATE_ATTENDANCE: "This user has already submitted attendance",
    DUPLICATE_DEVICE_SUBMISSION: "This device already submitted attendance",
  };

  constructor() {
    this.router.post(
      "/:sessionId",
      submitLimiter,
      validate({ params: attendanceParamsSchema, body: attendanceBodySchema }),
      this.submitAttendance,
    );

    this.router.get(
      "/:sessionId/validate",
      validate({ params: attendanceParamsSchema, query: validateQuerySchema }),
      this.validateToken,
    );

    this.router.post(
      "/:sessionId/token",
      mintLimiter,
      validate({ params: attendanceParamsSchema }),
      this.mintToken,
    );
  }

  private submitAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, userId, name, surname, section } = req.body as z.infer<typeof attendanceBodySchema>;
      const rawClientId = req.headers["x-client-id"];
      const clientId = Array.isArray(rawClientId) ? rawClientId[0] : rawClientId;

      const result = await sessionService.submitAttendance(
        req.params.sessionId,
        token,
        { userId, name, surname, section },
        clientId?.trim() || undefined,
      );

      if (!result.ok) {
        const reason = result.reason as Reason;
        const status = reason === "SESSION_NOT_FOUND" ? 404 : 400;
        const message = this.rejectionMessages[reason] ?? "Invalid request";
        throw new AppError(message, {
          status,
          code: reason,
          body: { success: false, reason, message },
        });
      }

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  };

  private validateToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params as z.infer<typeof attendanceParamsSchema>;
      const { token } = req.query as z.infer<typeof validateQuerySchema>;
      const session = await sessionService.getSession(sessionId);
      if (!session) {
        throw new AppError("Session not found", {
          status: 404,
          code: "SESSION_NOT_FOUND",
          body: { ok: false, reason: "SESSION_NOT_FOUND", message: "Session not found" },
        });
      }
      if (!session.isActive) {
        throw new AppError("Session is closed", {
          status: 400,
          code: "SESSION_CLOSED",
          body: { ok: false, reason: "SESSION_CLOSED", message: "Session is closed" },
        });
      }
      const valid = session.tokens.includes(token);
      if (!valid) {
        throw new AppError("Invalid or already used token", {
          status: 400,
          code: "TOKEN_INVALID",
          body: { ok: false, reason: "TOKEN_INVALID", message: "Invalid or already used token" },
        });
      }
      const { name } = session;
      res.json({ ok: true, sessionId, sessionName: name });
    } catch (err) {
      next(err);
    }
  };

  private mintToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params as z.infer<typeof attendanceParamsSchema>;
      const session = await sessionService.getSession(sessionId);
      if (!session) {
        throw new AppError("Session not found", {
          status: 404,
          body: { success: false, message: "Session not found" },
        });
      }
      if (!session.isActive) {
        throw new AppError("Session is closed", {
          status: 400,
          body: { success: false, message: "Session is closed" },
        });
      }

      const token = await sessionService.issueAttendanceToken(sessionId);
      if (!token) {
        throw new AppError("Token could not be generated", {
          status: 404,
          body: { success: false, message: "Token could not be generated" },
        });
      }

      const base = resolveFrontendBase(req);
      const attendUrl = `${base}/attend/${encodeURIComponent(sessionId)}?token=${encodeURIComponent(token)}`;
      res.json({ success: true, token, attendUrl });
    } catch (err) {
      next(err);
    }
  };
}

const attendanceController = new AttendanceController();
export const attendanceRouter = attendanceController.router;
export default attendanceController.router;
