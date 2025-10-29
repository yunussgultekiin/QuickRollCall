import http from "http";
import app from "./app";
import { config } from "./config";
import logger from "../middleware/logger.middleware";

const server = http.createServer(app);

server.listen(config.port, async () => {
  logger.info(`Server running in ${config.nodeEnv} on port ${config.port}`);
  logger.info(`http://localhost:${config.port}/`);
});

async function shutdown(signal: string) {
  logger.info(`Received ${signal}. Shutting down...`);
  const { disconnectRedis } = await import("../cache/redis.client");
  try { await disconnectRedis(); } catch (e) { logger.warn(`Redis disconnect error: ${(e as Error).message}`); }
  server.close((err) => {
    if (err) {
      logger.error(`Error during server close: ${err.message}`);
      process.exitCode = 1;
    }
    process.exit();
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));