const LogLevel = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const;

type LogLevelKey = keyof typeof LogLevel;

export function logger(level: LogLevelKey, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const env = process.env.NODE_ENV;
  const logLevel = LogLevel[level] ?? 1;
  const envLevel = (process.env.LOG_LEVEL as LogLevelKey) || 'info';
  const minLevel = LogLevel[envLevel] ?? 1;

  if (logLevel >= minLevel) {
    console.log(
      JSON.stringify({
        timestamp,
        level: level.toUpperCase(),
        env,
        message,
        ...(data ? { data } : {}),
      })
    );
  }
}
