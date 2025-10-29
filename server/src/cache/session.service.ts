import TokenGenerator from "../services/token-generator.service";
import redisService from "./redis.service";
import { config } from "../api/config";

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
  tokens: string[];
  ownerToken: string;
}

const SESSION_KEY = (id: string) => `session:${id}`;
const SUBMITTED_KEY = (id: string) => `submitted:${id}`;

export class SessionService {
  private tokenGen = new TokenGenerator();

  async createSession(opts?: { name?: string; durationMinutes?: number }) {
    const sessionId = await this.tokenGen.generate({ format: "uuid" });
    const ownerToken = await this.tokenGen.generate({ format: "hex", bytes: 24 });

    const session: SessionData = {
      id: sessionId,
      isActive: true,
      createdAt: Date.now(),
      name: opts?.name,
      durationMinutes: opts?.durationMinutes,
      attendance: [],
      tokens: [],
      ownerToken,
    };

    await redisService.set(SESSION_KEY(sessionId), session, config.sessionTtlSeconds);

    const base = config.frontendBaseUrl;
    return {
      session,
      instructorUrl: `${base}/session/${sessionId}`,
      attendUrl: `${base}/attend/${sessionId}`,
    };
  }

  private isExpired(session: SessionData): boolean {
    if (!session.durationMinutes) return false;
    const expiresAt = session.createdAt + session.durationMinutes * 60_000;
    return Date.now() >= expiresAt;
  }

  private async autoCloseIfExpired(sessionId: string): Promise<SessionData | null> {
    const session = await redisService.get<SessionData>(SESSION_KEY(sessionId));
    if (!session) return null;

    if (session.isActive && this.isExpired(session)) {
      session.isActive = false;
      session.closedAt = Date.now();
      session.tokens = [];
      await redisService.set(SESSION_KEY(sessionId), session, config.sessionTtlSeconds);
    }
    return session;
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    return this.autoCloseIfExpired(sessionId);
  }

  async verifyOwner(sessionId: string, token?: string): Promise<boolean> {
    if (!token) return false;
    const session = await this.getSession(sessionId);
    return !!session && session.ownerToken === token;
  }

  async closeSession(sessionId: string): Promise<SessionData | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;

    session.isActive = false;
    session.closedAt = Date.now();
    session.tokens = [];

    await redisService.set(SESSION_KEY(sessionId), session, config.sessionTtlSeconds);
    return session;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const deleted = await redisService.del(SESSION_KEY(sessionId));
    await redisService.del(SUBMITTED_KEY(sessionId));
    return deleted > 0;
  }

  async issueAttendanceToken(sessionId: string): Promise<string | null> {
    const session = await this.autoCloseIfExpired(sessionId);
    if (!session || !session.isActive) return null;

    const token = await this.tokenGen.generate({ format: "hex", bytes: 16 });
    session.tokens.push(token);

    await redisService.set(SESSION_KEY(sessionId), session, config.sessionTtlSeconds);
    return token;
  }

  async submitAttendance(
    sessionId: string,
    token: string,
    record: Omit<AttendanceRecord, "timestamp">,
    clientId?: string
  ): Promise<{ ok: boolean; reason?: string; session?: SessionData }> {
    const session = await this.autoCloseIfExpired(sessionId);
    if (!session) return { ok: false, reason: "SESSION_NOT_FOUND" };
    if (!session.isActive) return { ok: false, reason: "SESSION_CLOSED" };

    if (clientId) {
      const submittedKey = SUBMITTED_KEY(sessionId);
      const alreadySubmitted = await redisService.sIsMember(submittedKey, clientId);
      if (alreadySubmitted) return { ok: false, reason: "DUPLICATE_DEVICE_SUBMISSION" };
    }

    const tokenIndex = session.tokens.indexOf(token);
    if (tokenIndex === -1) return { ok: false, reason: "TOKEN_INVALID" };

    if (session.attendance.some(a => a.userId === record.userId)) {
      return { ok: false, reason: "DUPLICATE_ATTENDANCE" };
    }

    session.tokens.splice(tokenIndex, 1);
    session.attendance.push({ ...record, timestamp: Date.now() });

    await redisService.set(SESSION_KEY(sessionId), session, config.sessionTtlSeconds);

    if (clientId) {
      const submittedKey = SUBMITTED_KEY(sessionId);
      await redisService.sAdd(submittedKey, clientId);
      await redisService.expire(submittedKey, config.sessionTtlSeconds);
    }

    return { ok: true, session };
  }
}

export default new SessionService();
