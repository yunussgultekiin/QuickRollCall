import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config";
import { requestLogger } from "../middleware/request-logger.middleware";
import { errorHandler } from "../middleware/error-handler.middleware";
import { setupSwagger } from "./swagger";
import sessionsRouter from "../routes/session.route";
import attendanceRouter from "../routes/attendance.route";
import redisRouter from "../routes/redis.route";
import exportRouter from "../routes/export.route";
import clientLogsRouter from "../routes/client-logs.route";
import identityRouter from "../routes/identity.route";
import logger from "../middleware/logger.middleware";

const app = express();

app.set("trust proxy", true);
app.use(helmet());
setupSwagger(app);

const allowedOrigins = (config.corsOrigin || "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const isWildcard = allowedOrigins.includes("*");
if (config.isProd && isWildcard) {
  logger.warn(
    "CORS is configured as wildcard (*) in production. Set CORS_ORIGIN to your frontend domain (comma-separated for multiple)."
  );
}

app.use(
  cors({
    origin:
      config.isProd && !isWildcard
        ? (origin, callback) => {
            if (!origin) return callback(null, true);
            const ok = allowedOrigins.some((o) => o === origin);
            return ok ? callback(null, true) : callback(new Error("Not allowed by CORS"));
          }
        : isWildcard
        ? "*" // truly allow any origin in dev when wildcard is configured
        : allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: false,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.use("/api/redis", redisRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/export", exportRouter);
app.use("/api/logs", clientLogsRouter);
app.use("/api/identity", identityRouter);

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: API health check
 *     description: Checks whether the service is running or not
 *     responses:
 *       200:
 *         description: Service is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 service:
 *                   type: string
 *               example:
 *                 status: "ok"
 *                 service: "Quick Roll Call"
 */
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "Quick Roll Call" });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Not Found" });
});

app.use(errorHandler);

export default app;