import { Request, Response, NextFunction } from 'express';
import sessionService from '../cache/session.service';

function extractOwnerToken(req: Request): string | undefined {
  const auth = req.headers['authorization'];
  if (auth && /^bearer /i.test(auth)) {
    return auth.replace(/^bearer /i, '').trim();
  }
  const hdr = req.headers['x-owner-token'];
  if (typeof hdr === 'string' && hdr.trim()) return hdr.trim();
  if (Array.isArray(hdr) && hdr[0]) return String(hdr[0]).trim();
  return undefined;
}

export async function requireSessionOwner(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionId = req.params.sessionId || (req.body && req.body.sessionId);
    if (!sessionId) return res.status(400).json({ success: false, message: 'Missing sessionId' });
    const token = extractOwnerToken(req);
    const ok = await sessionService.verifyOwner(sessionId, token);
    if (!ok) return res.status(403).json({ success: false, message: 'Forbidden' });
    (req as any).ownerToken = token;
    next();
  } catch (e) {
    next(e);
  }
}

export async function attachOwnerFlag(req: Request, _res: Response, next: NextFunction) {
  try {
    const sessionId = req.params.sessionId;
    if (sessionId) {
      const token = extractOwnerToken(req);
      (req as any).isOwner = await sessionService.verifyOwner(sessionId, token);
    }
  } catch {}
  next();
}

export default requireSessionOwner;