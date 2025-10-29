type Level = 'debug' | 'info' | 'warn' | 'error';

type LogMeta = Record<string, unknown> | undefined;

interface Transport {
  log(level: Level, message: string, meta?: LogMeta): void | Promise<void>;
}

const originalConsole: Record<Level, (...args: any[]) => void> = {
  debug: (console.debug || console.log).bind(console),
  info: (console.info || console.log).bind(console),
  warn: (console.warn || console.log).bind(console),
  error: (console.error || console.log).bind(console),
};

class ConsoleTransport implements Transport {
  log(level: Level, message: string, meta?: LogMeta) {
    if (typeof window === 'undefined') return;

    const payload = meta ? [message, meta] : [message];
    
    if (import.meta.env.DEV) {
      originalConsole[level](...payload);
    } else {
      if (level === 'error') {
        originalConsole.error(...payload);
      }
    }
  }
}

class HttpTransport implements Transport {
  private endpoint: string;
  private disabledUntil = 0;

  constructor(endpoint?: string) {
    const envUrl = (import.meta as any).env?.VITE_BACKEND_URL as string | undefined;
    this.endpoint = endpoint || (envUrl ? `${envUrl.replace(/\/$/, '')}/api/logs` : '/api/logs');
  }

  async log(level: Level, message: string, meta?: LogMeta) {
    const now = Date.now();
    if (now < this.disabledUntil) return;
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, message, meta }),
        keepalive: true,
      });
    } catch {
      this.disabledUntil = Date.now() + 10_000;
    }
  }
}

class Logger {
  private transports: Transport[] = [];

  constructor(transports: Transport[]) {
    this.transports = transports;
  }

  private emit(level: Level, message: string, meta?: LogMeta) {
    for (const transport of this.transports) {
      try {
        transport.log(level, message, meta);
      } catch {}
    }
  }
  debug(msg: string, meta?: LogMeta) { this.emit('debug', msg, meta); }
  info(msg: string, meta?: LogMeta) { this.emit('info', msg, meta); }
  warn(msg: string, meta?: LogMeta) { this.emit('warn', msg, meta); }
  error(msg: string, meta?: LogMeta) { this.emit('error', msg, meta); }
}

const ENABLE_SERVER_LOGS = (import.meta as any).env?.VITE_ENABLE_SERVER_LOGS === 'true';

const transports: Transport[] = [new ConsoleTransport()];
if (ENABLE_SERVER_LOGS) {
  transports.push(new HttpTransport());
}
export const logger = new Logger(transports);

export function wireGlobalErrorLogging() {
  if (typeof window === 'undefined') return;

  const onError = (event: ErrorEvent) => {
    logger.error(event.message || 'Unhandled error', {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: serializeError(event.error),
    });
  };

  const onRejection = (event: PromiseRejectionEvent) => {
    logger.error('Unhandled promise rejection', { reason: serializeError(event.reason) });
  };

  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);
}

function serializeError(err: unknown): object | string | undefined {
  if (!err) return undefined;
  if (err instanceof Error) return { name: err.name, message: err.message, stack: err.stack };
  try {
    return JSON.parse(JSON.stringify(err));
  } catch {
    return String(err);
  }
}

export function hookConsoleLogging() {
  if (typeof window === 'undefined') return;
  
  (Object.keys(originalConsole) as Level[]).forEach((level) => {
    const originalMethod = console[level].bind(console);
    (console as any)[level] = (...args: any[]) => {
      let message: string;
      try {
        message = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ');
      } catch {
        message = 'Could not serialize console arguments.';
      }

      logger[level](message);
      if (!import.meta.env.DEV && level !== 'error') {
        return;
      }
      
      if(import.meta.env.DEV){
        originalMethod(...args);
      } else if (level === 'error') {
        originalMethod(...args);
      }
    };
  });
}

export function wireFrontendLogging() {
  hookConsoleLogging(); 
  wireGlobalErrorLogging();
}