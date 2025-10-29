import { useEffect, useState, useCallback, useRef } from "react";
import { sessionsApi, type SessionGetResponse } from "../services/api";
import QRCode from 'qrcode';

export type ErrorState = {
  message: string;
  status?: number;
} | null;

export function useSessionData(sessionId?: string) {
  const [session, setSession] = useState<SessionGetResponse | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [attendUrl, setAttendUrl] = useState<string | null>(null);
  const [error, setError] = useState<ErrorState>(null);

  useEffect(() => {
    if (!sessionId) return;
    let mounted = true;
    (async () => {
      try {
        const data = await sessionsApi.get(sessionId);
        if (mounted) setSession(data);
      } catch (e: any) {
        if (mounted) setError({
          message: e?.response?.data?.message || e?.message || "Failed to load session",
          status: e?.response?.status,
        });
      }
    })();
    return () => { mounted = false; };
  }, [sessionId]);

  const refreshToken = useCallback(async () => {
    if (!sessionId) return;
    try {
      // Use stable attend URL without token; attendees will auto-mint tokens on arrival
      const base = window.location.origin;
      setAttendUrl(`${base}/attend/${encodeURIComponent(sessionId)}`);
    } catch (e: any) {
      setError({
        message: e?.response?.data?.message || e?.message || "Failed to issue token",
        status: e?.response?.status,
      });
    }
  }, [sessionId]);

  const closeSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await sessionsApi.close(sessionId);
      setSession((prev) => prev ? { ...prev, ...res.session } : res.session);
    } catch (e: any) {
      throw e;
    }
  }, [sessionId]);

  const initialTokenRequestedRef = useRef(false);
  useEffect(() => {
    if (!sessionId || !session || !session.isActive || initialTokenRequestedRef.current) return;
    initialTokenRequestedRef.current = true;
    refreshToken();
  }, [sessionId, session, refreshToken]);

  useEffect(() => {
    (async () => {
      if (attendUrl) {
        try { 
          setQrDataUrl(await QRCode.toDataURL(attendUrl)); 
        } 
        catch(e) {
          console.error("Failed to generate QR code:", e);
        }
      }
    })();
  }, [attendUrl]);

  return { session, qrDataUrl, attendUrl, error, refreshToken, closeSession };
}
