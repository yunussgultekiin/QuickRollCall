import { createClient} from "redis";
import logger from "../middleware/logger.middleware";
import { config, getRedisEndpointPretty } from "../api/config";

export type RedisClient = ReturnType<typeof createClient>;

class RedisClientManager {
  private static client: RedisClient | null = null;
  private static isConnecting = false;
  private static readonly RETRY_DELAY_MS = 50;

  private static async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private static createClientInstance(): RedisClient {
    const options = config.redisUrl
    ? { url: config.redisUrl}
    : {
      socket: { host: config.redisHost, port: config.redisPort},
      username: config.redisUsername,
      password: config.redisPassword,
      database: config.redisDb,
    };
    const client = createClient(options);

    client.on("error", (err) => logger.error(`Redis error: ${err?.message}`));
    client.on("connect", () =>
      logger.info(`Redis connecting to ${getRedisEndpointPretty()}`)
    );
    client.on("ready", () => logger.info("Redis ready"));
    client.on("reconnecting", () => logger.warn("Redis reconnecting..."));
    client.on("end", () => logger.warn("Redis connection closed"));

    return client;
  }

  static async getClient(): Promise<RedisClient> {
    if (this.client?.isOpen) return this.client;

    if (this.isConnecting) {
      await this.delay(this.RETRY_DELAY_MS);
      return this.getClient();
    }

    this.isConnecting = true;
    try {
      const newClient = this.createClientInstance();
      await newClient.connect();
      this.client = newClient;
      return newClient;
    } finally {
      this.isConnecting = false;
    }
  }

  static async disconnect(): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.quit();
    } catch (err) {
      logger.warn(
        `Redis quit failed, forcing disconnect: ${(err as Error).message}`
      );
      await this.client.disconnect().catch(() => {});
    } finally {
      this.client = null;
    }
  }

  static async isActive(): Promise<{ active: boolean; error?: string }> {
    try {
      const client = await this.getClient();
      const pong = await client.ping();
      return { active: pong === "PONG" };
    } catch (e: any) {
      return { active: false, error: e?.message || String(e) };
    }
  }
} 

export const getRedisClient = () => RedisClientManager.getClient();
export const disconnectRedis = () => RedisClientManager.disconnect();
export const isRedisActive = () => RedisClientManager.isActive();

export default RedisClientManager;