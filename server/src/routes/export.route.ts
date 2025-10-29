import { NextFunction, Request, Response, Router } from "express";
import { z } from "zod";
import sessionService, { SessionData } from "../cache/session.service";
import pdfService from "../services/pdf.service";
import { validate } from "../middleware/validate.middleware";
import { requireSessionOwner } from "../middleware/owner-auth.middleware";
import { AppError } from "../errors/AppError";

const exportParamsSchema = z.object({ sessionId: z.string().min(1) });

/**
 * @swagger
 * /api/export/{sessionId}/preview:
 *   get:
 *     summary: Get export snapshot preview (non-destructive)
 *     description: Returns a snapshot of session metadata & attendance for UI preview before PDF generation.
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Snapshot data returned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExportPreviewResponse'
 *       404:
 *         description: Session not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericErrorResponse'
 *
 * /api/export/{sessionId}/pdf:
 *   get:
 *     summary: Export session attendance to PDF (snapshot + early purge)
 *     description: |
 *       Creates an in-memory snapshot then schedules asynchronous deletion of the session before PDF streaming completes.
 *       A second download attempt after the first may return 404 due to early purge.
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF binary stream.
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Session not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericErrorResponse'
 */

class ExportController {
  public readonly router = Router();

  constructor() {
    this.router.get(
      "/:sessionId/preview",
      validate({ params: exportParamsSchema }),
      requireSessionOwner,
      this.getPreview,
    );

    this.router.get(
      "/:sessionId/pdf",
      validate({ params: exportParamsSchema }),
      requireSessionOwner,
      this.downloadPdf,
    );
  }

  private getPreview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await sessionService.getSession(req.params.sessionId);
      if (!session) {
        throw new AppError("Session not found", {
          status: 404,
          body: { success: false, message: "Session not found" },
        });
      }
      const { tokens, ...safe } = session as SessionData & { tokens: string[] };
      res.json({ success: true, session: safe });
    } catch (err) {
      next(err);
    }
  };

  private downloadPdf = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let session = await sessionService.getSession(req.params.sessionId);
      if (!session) {
        throw new AppError("Session not found", {
          status: 404,
          body: { success: false, message: "Session not found" },
        });
      }
      if (session.isActive) {
        const closed = await sessionService.closeSession(session.id);
        if (closed) session = closed;
      }
      const snapshot: SessionData = JSON.parse(JSON.stringify(session));

      setImmediate(() => {
        sessionService.deleteSession(session.id).catch(() => {});
      });

      const baseNameRaw = snapshot.name?.trim() ?? "";
      const safeName = baseNameRaw.replace(/[\/:*?"<>|]+/g, "").replace(/\s+/g, "_").slice(0, 80) || "attendance";
      const filename = `${safeName}.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

      const doc = pdfService.createDoc();
      pdfService.buildAttendance(doc, snapshot);
      doc.on("error", (err: Error) => next(err));
      doc.pipe(res);
      doc.end();
    } catch (err) {
      next(err);
    }
  };
}

const exportController = new ExportController();
export const exportRouter = exportController.router;
export default exportController.router;
