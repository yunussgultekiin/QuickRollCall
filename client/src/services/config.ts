function resolveBaseUrl(value: string | undefined, fallback: string, warnMessage: string) {
  if (value && value.trim()) return value.trim();
  try {
    console?.warn?.(warnMessage);
  } catch {}
  return fallback;
}

const defaultOrigin = typeof window !== 'undefined' && window.location?.origin
  ? window.location.origin
  : 'http://localhost:5173';

const apiFallback = typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:5000/api';

const config = {
  apiBaseUrl: resolveBaseUrl((import.meta as any).env?.VITE_API_BASE_URL, apiFallback, '[config] VITE_API_BASE_URL missing, using fallback.'),
  appBaseUrl: resolveBaseUrl((import.meta as any).env?.VITE_APP_BASE_URL, defaultOrigin, '[config] VITE_APP_BASE_URL missing, using window.origin.'),
};

export default config;