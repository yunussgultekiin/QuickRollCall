import { getRedisClient } from "./redis.client";
import logger from "../middleware/logger.middleware";

export interface IRedisService {
  set<T = unknown>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  get<T = unknown>(key: string): Promise<T | null>;
  del(key: string): Promise<number>;
  exists(key: string): Promise<boolean>;
  sIsMember(key: string, member: string): Promise<boolean>;
  sAdd(key: string, member: string): Promise<number>;
  expire(key: string, ttlSeconds: number): Promise<boolean>;
}

export class RedisService implements IRedisService {
  async set<T = unknown>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const client = await getRedisClient();
    const payload = JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await client.set(key, payload, { EX: ttlSeconds });
    } else {
      await client.set(key, payload);
    }
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const client = await getRedisClient();
    const raw = await client.get(key);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as T;
    } catch (error) {
      logger.error(`RedisService: Failed to parse JSON for key "${key}"`, error);
      return null;
    }
  }

  async del(key: string): Promise<number> {
    const client = await getRedisClient();
    return client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const client = await getRedisClient();
    const n = await client.exists(key);
    return n > 0;
  }

  async sIsMember(key: string, member: string): Promise<boolean> {
    const client = await getRedisClient();
    return (await client.sIsMember(key, member)) === 1;
  }

  async sAdd(key: string, member: string): Promise<number> {
    const client = await getRedisClient();
    return client.sAdd(key, member);
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    if (!ttlSeconds || ttlSeconds <= 0) return false;
    const client = await getRedisClient();
    const result = await client.expire(key, ttlSeconds);
    return result === 1;
  }
}

export default new RedisService();
