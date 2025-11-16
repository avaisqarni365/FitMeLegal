import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';

export interface LogContext {
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: any;
}

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private context?: string;

  setContext(context: string) {
    this.context = context;
  }

  /**
   * Log a message
   */
  log(message: string, context?: LogContext) {
    this.formatLog('LOG', message, context);
  }

  /**
   * Log an error
   */
  error(message: string, trace?: string, context?: LogContext) {
    this.formatLog('ERROR', message, { ...context, trace });
  }

  /**
   * Log a warning
   */
  warn(message: string, context?: LogContext) {
    this.formatLog('WARN', message, context);
  }

  /**
   * Log debug information
   */
  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== 'production') {
      this.formatLog('DEBUG', message, context);
    }
  }

  /**
   * Log verbose information
   */
  verbose(message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== 'production') {
      this.formatLog('VERBOSE', message, context);
    }
  }

  /**
   * Log HTTP request
   */
  logRequest(req: any, res: any, duration: number) {
    const context: LogContext = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent'),
      userId: req.user?.userId,
    };

    const message = `${req.method} ${req.url} ${res.statusCode} - ${duration}ms`;

    if (res.statusCode >= 500) {
      this.error(message, undefined, context);
    } else if (res.statusCode >= 400) {
      this.warn(message, context);
    } else {
      this.log(message, context);
    }
  }

  /**
   * Log database query
   */
  logQuery(query: string, duration: number, params?: any) {
    const context: LogContext = {
      query,
      duration,
      params,
    };

    this.debug(`Query executed in ${duration}ms`, context);
  }

  /**
   * Log authentication event
   */
  logAuth(event: string, userId?: string, success: boolean = true, metadata?: any) {
    const context: LogContext = {
      userId,
      success,
      event,
      ...metadata,
    };

    if (success) {
      this.log(`Auth: ${event}`, context);
    } else {
      this.warn(`Auth failed: ${event}`, context);
    }
  }

  /**
   * Log security event
   */
  logSecurity(event: string, severity: 'low' | 'medium' | 'high' | 'critical', metadata?: any) {
    const context: LogContext = {
      severity,
      event,
      ...metadata,
    };

    if (severity === 'critical' || severity === 'high') {
      this.error(`Security: ${event}`, undefined, context);
    } else {
      this.warn(`Security: ${event}`, context);
    }
  }

  /**
   * Log business event
   */
  logEvent(event: string, metadata?: any) {
    const context: LogContext = {
      event,
      ...metadata,
    };

    this.log(`Event: ${event}`, context);
  }

  /**
   * Log performance metric
   */
  logPerformance(operation: string, duration: number, metadata?: any) {
    const context: LogContext = {
      operation,
      duration,
      ...metadata,
    };

    if (duration > 5000) {
      this.warn(`Slow operation: ${operation} took ${duration}ms`, context);
    } else {
      this.debug(`Performance: ${operation} completed in ${duration}ms`, context);
    }
  }

  /**
   * Format and output log
   */
  private formatLog(level: string, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const ctx = this.context || 'Application';

    // Structured log format (JSON in production, readable in development)
    if (process.env.NODE_ENV === 'production') {
      const logEntry = {
        timestamp,
        level,
        context: ctx,
        message,
        ...context,
      };
      console.log(JSON.stringify(logEntry));
    } else {
      // Human-readable format for development
      const colorCode = this.getColorCode(level);
      const resetCode = '\x1b[0m';
      const contextStr = context ? ` ${JSON.stringify(context)}` : '';

      console.log(
        `${colorCode}[${timestamp}] [${level}]${resetCode} [${ctx}] ${message}${contextStr}`,
      );
    }
  }

  /**
   * Get ANSI color code for log level
   */
  private getColorCode(level: string): string {
    const colors: Record<string, string> = {
      ERROR: '\x1b[31m', // Red
      WARN: '\x1b[33m', // Yellow
      LOG: '\x1b[32m', // Green
      DEBUG: '\x1b[36m', // Cyan
      VERBOSE: '\x1b[35m', // Magenta
    };
    return colors[level] || '\x1b[37m'; // Default white
  }
}
