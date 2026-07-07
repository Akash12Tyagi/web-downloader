type Level = 'info' | 'warn' | 'error' | 'debug';

function line(level: Level, message: string, meta?: Record<string, unknown>) {
  const entry = {
    time: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  const serialized = JSON.stringify(entry);
  if (level === 'error') console.error(serialized);
  else if (level === 'warn') console.warn(serialized);
  else console.log(serialized);
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => line('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => line('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => line('error', message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== 'production') line('debug', message, meta);
  },
};
