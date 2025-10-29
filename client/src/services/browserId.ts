import axios from 'axios';
import config from './config';

const KEY = 'qr_browser_id_v1';
let cachedId: string | null = null;
let inflight: Promise<string> | null = null;

async function fetchServerId(): Promise<string> {
  const base = config.apiBaseUrl || '/api';
  const { data } = await axios.get(`${base}/identity`);
  const id = String(data?.id || '').trim();
  if (!id) throw new Error('Identity service returned empty id');
  return id;
}

export async function getBrowserId(): Promise<string> {
  if (cachedId) return cachedId;

  try {
    const existing = localStorage.getItem(KEY);
    if (existing && existing.length > 10) {
      cachedId = existing;
      return existing;
    }
  } catch {
    // ignore localStorage errors and proceed to server fetch
  }

  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const id = await fetchServerId();
      try { localStorage.setItem(KEY, id); } catch {}
      cachedId = id;
      return id;
    } catch {
      // Fallback to local random stable id if server identity fails
      let tmp = '';
      try {
        // Prefer spec uuid if available
        const anyCrypto: any = (globalThis as any).crypto;
        if (anyCrypto && typeof anyCrypto.randomUUID === 'function') tmp = anyCrypto.randomUUID();
      } catch {}
      if (!tmp) tmp = `tmp-${Math.random().toString(36).slice(2, 12)}`;
      try { localStorage.setItem(KEY, tmp); } catch {}
      cachedId = tmp;
      return tmp;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}
