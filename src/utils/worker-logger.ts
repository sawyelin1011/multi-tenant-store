import { Context } from 'hono';

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export class WorkerLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  debug(message: string, context?: Record<string, any>) {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
    console.log(`[INFO] ${message}`, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
    console.warn(`[WARN] ${message}`, context);
  }

  error(message: string, error?: Error | Record<string, any>) {
    const context = error instanceof Error ? undefined : (error as Record<string, any>);
    this.log('error', message, context, error instanceof Error ? error : undefined);
    console.error(`[ERROR] ${message}`, error);
  }

  private log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    context?: Record<string, any>,
    error?: Error
  ) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}

export function createLogger(): WorkerLogger {
  return new WorkerLogger();
}

export function logRequest(c: Context, logger: WorkerLogger) {
  const method = c.req.method;
  const path = c.req.path;
  const timestamp = new Date().toISOString();

  logger.debug(`[${timestamp}] ${method} ${path}`);
}

export function logResponse(c: Context, logger: WorkerLogger, statusCode: number, duration: number) {
  const method = c.req.method;
  const path = c.req.path;
  const timestamp = new Date().toISOString();

  logger.info(`[${timestamp}] ${method} ${path} - ${statusCode} (${duration}ms)`);
}
