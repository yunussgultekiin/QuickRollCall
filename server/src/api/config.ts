import dotenv from "dotenv";

dotenv.config();

const toNumber = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

interface Config {
  port: number;
  nodeEnv: string;
  isProd: boolean;
  corsOrigin: string;
  logDir: string;
  redisUrl?: string;
  redisHost: string;
  redisPort: number;
  redisUsername?: string;
  redisPassword?: string;
  redisDb: number;
  sessionTtlSeconds: number;
  frontendBaseUrl: string;
}

export const config: Config = {
  port: toNumber(process.env.PORT, 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  isProd: (process.env.NODE_ENV || "development") === "production",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  logDir: process.env.LOG_DIR || "logs",
  redisUrl: process.env.REDIS_URL,
  redisHost: process.env.REDIS_HOST || "localhost",
  redisPort: toNumber(process.env.REDIS_PORT, 6379),
  redisUsername: process.env.REDIS_USERNAME || undefined,
  redisPassword: process.env.REDIS_PASSWORD || undefined,
  redisDb: toNumber(process.env.REDIS_DB, 0),
  sessionTtlSeconds: toNumber(process.env.SESSION_TTL_SECONDS, 60 * 60),
  frontendBaseUrl: process.env.FRONTEND_BASE_URL || "http://localhost:5173",
};

export function resolveFrontendBase(req: any): string {
  if (process.env.FRONTEND_BASE_URL?.trim()) return process.env.FRONTEND_BASE_URL.trim();

  const getFirst = (v: any): string | undefined => {
    if (!v) return undefined;
    if (Array.isArray(v)) return String(v[0]).trim();
    const s = String(v);
    return s.split(',')[0].trim();
  };

  let xfProto = getFirst(req?.headers?.["x-forwarded-proto"]);
  let xfHost = getFirst(req?.headers?.["x-forwarded-host"]);
  if (xfProto && !/^https?$/i.test(xfProto)) {
    xfProto = xfProto.split(/[;\s]/)[0].replace(/:$/, "");
    if (!/^https?$/i.test(xfProto)) xfProto = undefined;
  }
  if (xfProto && xfHost) return `${xfProto}://${xfHost}`;
  const origin = req?.headers?.origin as string | undefined;
  if (origin) return origin;

  try {
    const ref = req?.headers?.referer as string | undefined;
    if (ref) {
      const u = new URL(ref);
      return `${u.protocol}//${u.host}`;
    }
  } catch {}
  return config.frontendBaseUrl;
};

export function getRedisEndpointPretty() {
  if (config.redisUrl) {
    try {
      const u = new URL(config.redisUrl);
      if (u.password) u.password = "***";
      return u.toString();
    } catch {
      return "(invalid REDIS_URL)";
    }
  }
  const authNeeded = !!(config.redisUsername || config.redisPassword);
  const user = config.redisUsername || "default";
  const auth = authNeeded ? `${user}:***@` : "";
  return `redis://${auth}${config.redisHost}:${config.redisPort}/${config.redisDb}`;
}