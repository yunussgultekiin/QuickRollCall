import { NextFunction, Request, Response, Router } from "express";
import TokenGenerator from "../services/token-generator.service";

const gen = new TokenGenerator();

/**
 * @swagger
 * /api/identity:
 *   get:
 *     summary: Issue a stable client identity
 *     description: Returns a server-generated identifier for the client to persist in localStorage.
 *     responses:
 *       200:
 *         description: Identity issued successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IdentityResponse'
 */
class IdentityController {
  public readonly router = Router();

  constructor() {
    this.router.get("/", this.issueIdentity);
  }

  private issueIdentity = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const id = await gen.generate({ format: "uuid" });
      res.json({ id });
    } catch (err) {
      next(err);
    }
  };
}

const identityController = new IdentityController();
export const identityRouter = identityController.router;
export default identityController.router;
