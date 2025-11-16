import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { LoggerService } from '../logger/logger.service';

/**
 * Enhanced throttler guard with logging and custom error messages
 */
@Injectable()
export class EnhancedThrottlerGuard extends ThrottlerGuard {
  constructor(private readonly logger: LoggerService) {
    super();
    this.logger.setContext('ThrottlerGuard');
  }

  protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.connection.remoteAddress;
    const route = `${request.method} ${request.url}`;

    this.logger.warn(`Rate limit exceeded for ${route}`, {
      ip,
      userAgent: request.headers['user-agent'],
      route,
    });

    throw new ThrottlerException('Too many requests, please try again later.');
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use user ID if authenticated, otherwise IP address
    const userId = req.user?.id;
    if (userId) {
      return `user:${userId}`;
    }

    // Fallback to IP address
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
}
