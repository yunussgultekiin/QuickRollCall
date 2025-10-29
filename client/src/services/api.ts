import axios, {type AxiosRequestHeaders } from "axios";
import { logger } from "./logger";
import { store } from "../store";
import { setLoading, setError, showSnackbar } from "../store/uiSlice";
import { getBrowserId } from './browserId';

declare module "axios" {
  interface AxiosRequestConfig {
    silent?: boolean;
    /** internal start time for tracing */
    _startTs?: number;
  }
}


export interface AttendanceRecord {
  userId: string;
  name: string;
  surname: string;
  section: string;
  timestamp: number;
}

export interface SessionData {
  id: string;
  isActive: boolean;
  createdAt: number;
  closedAt?: number;
  name?: string;
  durationMinutes?: number;
  attendance: AttendanceRecord[];
}


const env = (import.meta as any).env;
const ENABLE_HTTP_TRACE = env?.VITE_HTTP_TRACE === 'true' || env?.VITE_HTTP_TRACE === '1';

const host = typeof window !== 'undefined' ? window.location.hostname : '';
const isNgrok = /\.ngrok(-free)?\.app$/i.test(host);
const API_BASE_URL: string = isNgrok ? "/api" : (env?.VITE_API_BASE_URL ?? "/api");

let inflightRequestCount = 0;
const incrementInflight = (silent?: boolean) => {
  if (silent) return;
  inflightRequestCount++;
  if (inflightRequestCount === 1) { // Sadece ilk istekte dispatch et
    try { store.dispatch(setLoading(true)); } catch (e) { console.error("Redux dispatch error (setLoading true):", e); }
  }
};
const decrementInflight = (silent?: boolean) => {
  if (silent) return;
  inflightRequestCount = Math.max(0, inflightRequestCount - 1);
  if (inflightRequestCount === 0) {
    try { store.dispatch(setLoading(false)); } catch (e) { console.error("Redux dispatch error (setLoading false):", e); }
  }
};

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

const ownerTokenStore: Record<string, string> = {};

export function setOwnerToken(sessionId: string, token: string) {
  ownerTokenStore[sessionId] = token;
  try {
    localStorage.setItem('qr_owner_' + sessionId, token);
  } catch (error) {
    console.error("Failed to set owner token in localStorage:", error);
  }
}

function getOwnerToken(sessionId: string): string | undefined {
  if (ownerTokenStore[sessionId]) return ownerTokenStore[sessionId];
  try {
    const token = localStorage.getItem('qr_owner_' + sessionId);
    if (token) {
      ownerTokenStore[sessionId] = token;
      return token;
    }
    return undefined;
  } catch (error) {
    console.error("Failed to get owner token from localStorage:", error);
    return undefined;
  }
}

export function hasOwnerToken(sessionId: string): boolean {
  return !!getOwnerToken(sessionId);
}

function getSessionIdFromUrl(url: string = ''): string | null {
  const sessionMatch = /\/(?:sessions|export)\/([^/?]+)/.exec(url);
  if (sessionMatch && sessionMatch[1]) {
    return decodeURIComponent(sessionMatch[1]);
  }
  return null;
}

http.interceptors.request.use(async (config) => {
  incrementInflight(config.silent);

  if (ENABLE_HTTP_TRACE) {
    config._startTs = performance.now();
  }

  try {
    const sessionId = getSessionIdFromUrl(config.url);
    if (sessionId) {
      const ownerToken = getOwnerToken(sessionId);
      if (ownerToken) {
        if (!config.headers) {
          config.headers = {} as AxiosRequestHeaders;
        }
        config.headers.Authorization = 'Bearer ' + ownerToken;
      }
    }
    // Attach browser/client id for server-side rate limiting
    if (!config.headers) config.headers = {} as AxiosRequestHeaders;
    const clientId = await getBrowserId();
    (config.headers as any)['X-Client-Id'] = clientId;
  } catch (error) {
    console.error('Error attaching owner token in request interceptor:', error);
  }

  if (!ENABLE_HTTP_TRACE) {
    const method = (config.method || "get").toUpperCase();
    const url = config.url || "";
    logger.debug(`HTTP → ${method} ${url}`);
  }

  return config;
});

http.interceptors.response.use(
  (response) => {
    decrementInflight(response.config?.silent);
    
    if (ENABLE_HTTP_TRACE) {
      const config = response.config;
      const method = (config.method || 'get').toUpperCase();
      const url = config.url || '';
      const start = config._startTs || Date.now();
      const duration = Math.round(performance.now() - start);
      logger.info(`[frontend] ${method} ${url} ${response.status} ${duration}ms`);
    } else {
      logger.debug(`HTTP ← ${response.status} ${response.config.url || ''}`);
    }
    return response;
  },
  (error) => {
    decrementInflight(error.config?.silent);
    const message = error?.response?.data?.message || error?.message || "Request failed";
    
    store.dispatch(setError(message));
    if (!error.config?.silent) {
      store.dispatch(showSnackbar({ message, severity: "error" }));
    }

    const config = error.config || {};
    const method = (config.method || 'get').toUpperCase();
    const url = config.url || '';
    const status = error?.response?.status;

    if (ENABLE_HTTP_TRACE) {
      const start = config._startTs || Date.now();
      const duration = Math.round(performance.now() - start);
      logger.error(`[frontend] ${method} ${url} ${status ?? 'ERR'} ${duration}ms`, { message });
    } else {
      logger.error(`HTTP ✖ ${status ?? 'ERR'} ${url}`, { message });
    }

    return Promise.reject(error);
  }
);

export type SessionGetResponse = SessionData & {
  serverNow?: number;
  endTime?: number;
};

export const sessionsApi = {
  create: async (body: { name?: string; durationMinutes?: number }) => {
    const { data } = await http.post<{
      sessionId: string;
      isActive: boolean;
      instructorUrl: string;
      attendUrl: string;
      name?: string;
      durationMinutes?: number;
      token: string;
      ownerToken: string;
    }>(`/sessions`, body);
    if (data?.sessionId && data?.ownerToken) {
      setOwnerToken(data.sessionId, data.ownerToken);
    }
    return data;
  },
  get: async (sessionId: string, opts?: { silent?: boolean }) => {
    const { data } = await http.get<SessionGetResponse>(
      `/sessions/${encodeURIComponent(sessionId)}`,
      { silent: opts?.silent }
    );
    return data;
  },
  close: async (sessionId: string) => {
    const { data } = await http.post<{ success: boolean; session: SessionData }>(
      `/sessions/${encodeURIComponent(sessionId)}/close`
    );
    return data;
  },
  issueToken: async (sessionId: string) => {
    const { data } = await http.post<{ success: boolean; token: string; attendUrl: string }>(
      `/sessions/${encodeURIComponent(sessionId)}/token`
    );
    return data;
  },
};

export const attendanceApi = {
  submit: async (
    sessionId: string,
    body: { token: string; userId: string; name: string; surname: string; section: string }
  ) => {
    const { data } = await http.post<{ success: boolean }>(`/attendance/${encodeURIComponent(sessionId)}`, body);
    return data;
  },
  validate: async (sessionId: string, token: string, opts?: { silent?: boolean }) => {
    const { data } = await http.get<{ ok: boolean; sessionId: string; sessionName?: string }>(
      `/attendance/${encodeURIComponent(sessionId)}/validate?token=${encodeURIComponent(token)}`,
      { silent: opts?.silent }
    );
    return data;
  },
  mintToken: async (sessionId: string) => {
    const { data } = await http.post<{ success: boolean; token: string; attendUrl: string }>(
      `/attendance/${encodeURIComponent(sessionId)}/token`
    );
    return data;
  }
};

export const exportApi = {
  pdfUrl: (sessionId: string) => `${API_BASE_URL}/export/${encodeURIComponent(sessionId)}/pdf`,
};