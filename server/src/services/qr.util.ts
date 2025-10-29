import type { Request } from 'express';
import { resolveFrontendBase } from '../api/config';
import { QRGeneratorService } from '../services/qr.service';


export async function generateQrSession(sessionId: string, token: string, req: Request) {
  const base = resolveFrontendBase(req);
  const attendUrl = `${base}/attend/${sessionId}?token=${encodeURIComponent(token)}`;
  const qrGen = new QRGeneratorService();
  const qrCodeDataUrl = await qrGen.toDataURL(attendUrl);
  return { attendUrl, qrCodeDataUrl };
}

