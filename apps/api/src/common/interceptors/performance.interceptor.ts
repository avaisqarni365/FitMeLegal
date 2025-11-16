import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('PerformanceInterceptor');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const route = `${method} ${url}`;

        // Log slow requests (> 1 second)
        if (duration > 1000) {
          this.logger.warn(`Slow request detected: ${route}`, {
            method,
            url,
            duration,
            userId: request.user?.userId,
          });
        }

        // Log very slow requests as errors (> 5 seconds)
        if (duration > 5000) {
          this.logger.error(
            `Very slow request: ${route}`,
            undefined,
            {
              method,
              url,
              duration,
              userId: request.user?.userId,
            },
          );
        }

        // Track performance metrics
        this.logger.logPerformance(route, duration, {
          userId: request.user?.userId,
        });
      }),
    );
  }
}
