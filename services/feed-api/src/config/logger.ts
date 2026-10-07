export type LogSeverity = 'DEBUG' | 'INFO' | 'NOTICE' | 'WARNING' | 'ERROR' | 'CRITICAL';

/**
 * Structured Google Cloud Logging Logger.
 * Emits newline-delimited JSON compatible with GCP Cloud Logging agent.
 * Zero-cost Always Free: Uses the standard 50 GiB/month free tier of Google Cloud Logging.
 */
class CloudLogger {
  private format(severity: LogSeverity, message: string, meta: Record<string, any> = {}) {
    const logEntry = {
      severity,
      message,
      timestamp: new Date().toISOString(),
      service: 'feed-api',
      ...meta,
    };
    return JSON.stringify(logEntry);
  }

  info(message: string, meta: Record<string, any> = {}) {
    console.log(this.format('INFO', message, meta));
  }

  notice(message: string, meta: Record<string, any> = {}) {
    console.log(this.format('NOTICE', message, meta));
  }

  warn(message: string, meta: Record<string, any> = {}) {
    console.warn(this.format('WARNING', message, meta));
  }

  error(message: string, error?: any, meta: Record<string, any> = {}) {
    const errorDetails = error instanceof Error
      ? { errorName: error.name, errorMessage: error.message, stack: error.stack }
      : { error };
    console.error(this.format('ERROR', message, { ...errorDetails, ...meta }));
  }
}

export const logger = new CloudLogger();
