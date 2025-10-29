export type AppErrorOptions = {
  status?: number;
  code?: string;
  details?: unknown;
  body?: Record<string, unknown>;
  cause?: unknown;
};

/**
 * Centralized HTTP-friendly error.
 * Controllers can attach a preformatted body to preserve legacy response shapes.
 */
export class AppError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: unknown;
  public readonly body?: Record<string, unknown>;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = 'AppError';
    this.status = options.status ?? 500;
    this.code = options.code;
    this.details = options.details;
    this.body = options.body;
    if (options.cause) {
      (this as any).cause = options.cause;
    }
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
