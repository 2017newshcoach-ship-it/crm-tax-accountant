/**
 * Server-side structured logging utility
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
}

class ServerLogger {
  private formatLog(entry: LogEntry): string {
    const contextStr = entry.context ? ` | ${JSON.stringify(entry.context)}` : '';
    return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${contextStr}`;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    };

    const formattedLog = this.formatLog(entry);

    switch (level) {
      case 'debug':
        console.log(`🐛 ${formattedLog}`, error || '');
        break;
      case 'info':
        console.log(`ℹ️  ${formattedLog}`);
        break;
      case 'warn':
        console.warn(`⚠️  ${formattedLog}`, error || '');
        break;
      case 'error':
        console.error(`❌ ${formattedLog}`, error || '');
        break;
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>, error?: Error) {
    this.log('warn', message, context, error);
  }

  error(message: string, context?: Record<string, unknown>, error?: Error) {
    this.log('error', message, context, error);
  }

  /**
   * Log API request
   */
  request(method: string, path: string, context?: Record<string, unknown>) {
    this.info(`${method} ${path}`, context);
  }

  /**
   * Log API response
   */
  response(method: string, path: string, statusCode: number, duration?: number) {
    const level = statusCode >= 400 ? 'error' : 'info';
    const durationStr = duration ? ` (${duration}ms)` : '';
    this.log(level, `${method} ${path} - ${statusCode}${durationStr}`);
  }
}

export const logger = new ServerLogger();
