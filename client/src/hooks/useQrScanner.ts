import { useEffect, useRef, useState } from "react";

type Options = {
  active: boolean;
  onResult: (text: string) => void;
  onPayload?: (payload: InternalQrPayload) => void;
  aspectRatio?: number;
};

export interface InternalQrPayload {
  t: 'ATTEND';
  s: string; 
  v: number;
}

function parseInternalPayload(text: string): InternalQrPayload | null {
  try {
    const obj = JSON.parse(text);
    if (obj && obj.t === 'ATTEND' && typeof obj.s === 'string' && typeof obj.v === 'number') return obj as InternalQrPayload;
  } catch {}
  return null;
}

export function useQrScanner({ active, onResult, onPayload, aspectRatio = 3 / 4 }: Options) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<BarcodeDetector | null>(null);
  const usingFallbackRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fallbackDecoderRef = useRef<any>(null); // jsQR function

  const [error, setError] = useState<string | null>(null);
  const nativeSupported = typeof window !== "undefined" && "BarcodeDetector" in window;
  const [isSupported, setIsSupported] = useState<boolean>(nativeSupported);
  const [usingFallback, setUsingFallback] = useState(false);

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const start = async () => {
    setError(null);
    if (!nativeSupported) {
      try {
        const mod = await import('jsqr');
        fallbackDecoderRef.current = mod.default || (mod as any);
        canvasRef.current = document.createElement('canvas');
        usingFallbackRef.current = true;
        setUsingFallback(true);
        setIsSupported(true);
      } catch (e: any) {
        setError('QR scanning not supported (no native API and fallback failed).');
        setIsSupported(false);
        return;
      }
    }

    try {
      if (nativeSupported && !detectorRef.current) {
        detectorRef.current = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          aspectRatio: { ideal: aspectRatio },
          width: { ideal: 720 },
          height: { ideal: 960 },
        },
        audio: false,
      });

      streamRef.current = mediaStream;
      const videoEl = videoRef.current;
      if (!videoEl) throw new Error("Video element not found");

      videoEl.srcObject = mediaStream;
      await videoEl.play();

      const tick = async () => {
        const video = videoRef.current;
        const detector = detectorRef.current;

        if (!video || video.readyState < 2) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }

        try {
          if (nativeSupported && detector) {
            const codes = await detector.detect(video);
            if (codes?.length) {
              const raw = codes[0].rawValue || '';
              onResult(raw);
              const payload = parseInternalPayload(raw);
              if (payload && onPayload) onPayload(payload);
              stop();
              return;
            }
          } else if (usingFallbackRef.current && fallbackDecoderRef.current) {
            const canvas = canvasRef.current!;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              const vw = video.videoWidth;
              const vh = video.videoHeight;
              if (vw && vh) {
                const targetW = 480;
                const scale = targetW / vw;
                canvas.width = targetW;
                canvas.height = Math.round(vh * scale);
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const result = fallbackDecoderRef.current(id.data, canvas.width, canvas.height);
                if (result?.data) {
                  const raw = result.data;
                  onResult(raw);
                  const payload = parseInternalPayload(raw);
                  if (payload && onPayload) onPayload(payload);
                  stop();
                  return;
                }
              }
            }
          }
        } catch (e) {
          // swallow per-frame errors
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    } catch (e: any) {
      setError(e?.message || "Could not access camera. Check permissions.");
      stop();
    }
  };

  useEffect(() => {
    if (active) start();
    else stop();
    return () => stop();
  }, [active]);

  return { videoRef, error, isSupported, start, stop, usingFallback };
}
