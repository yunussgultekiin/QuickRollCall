import { useEffect, useMemo, useState } from "react";

type CountdownInput =
  | { endTimeIso?: string }
  | { endTimeMs?: number; serverNowMs?: number };

export function useCountdown(input?: CountdownInput) {
  const [remaining, setRemaining] = useState<number | null>(null);

  const targetAndNow = useMemo(() => {
    if (!input) return null;
    if ("endTimeMs" in input) {
      const target = input.endTimeMs ?? 0;
      const serverNow = input.serverNowMs ?? Date.now();
      const skew = serverNow - Date.now(); 
      return { target, skew };
    }
    if ("endTimeIso" in input) {
      const target = input.endTimeIso ? new Date(input.endTimeIso).getTime() : 0;
      return { target, skew: 0 };
    }
    return null;
  }, [input]);

  useEffect(() => {
    if (!targetAndNow) return;
    const { target, skew } = targetAndNow;
    let mounted = true;
    let lastWhole = -1;
    const tick = () => {
      if (!mounted) return;
      const now = Date.now();
      const effectiveNow = now + skew;
      const diff = target - effectiveNow;
      const next = diff > 0 ? diff : 0;
      const whole = Math.floor(next / 1000);
      if (whole !== lastWhole) {
        lastWhole = whole;
        setRemaining(next);
      }
    };
    tick();
    const interval = setInterval(tick, 250); 
    return () => { mounted = false; clearInterval(interval); };
  }, [targetAndNow]);

  return remaining;
}
