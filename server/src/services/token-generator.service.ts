import { randomBytes, randomUUID } from 'crypto';
import { promisify } from 'util';

const randomBytesAsync = promisify(randomBytes);
export type TokenFormat = 'uuid' | 'hex';

export interface TokenOptions {
  format?: TokenFormat;
  bytes?: number;
}

export default class TokenGenerator {
    async generate(options?: TokenOptions): Promise<string> {
      const format = options?.format ?? 'uuid';
      const bytes = options?.bytes ?? 16;
      if (format === 'hex') return this.generateHex(bytes);
      return this.generateUUID();
    }

    private async generateUUID(): Promise<string> {
      if (typeof randomUUID === 'function') return randomUUID();
      return this.generateHex(16);
    }

    private async generateHex(bytes: number): Promise<string> {
      const size = Math.min(Math.max(1, bytes), 1024);
      const buffer = await randomBytesAsync(size);
      return buffer.toString('hex');
    }
}