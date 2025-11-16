import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../cache/cache.service';
import { Reflector } from '@nestjs/core';

export const CACHE_KEY_METADATA = 'cache_key';
export const CACHE_TTL_METADATA = 'cache_ttl';

/**
 * Decorator to enable caching for a controller endpoint
 *
 * @param ttl Time to live in seconds (default: 60)
 *
 * Usage:
 * @CacheResponse(300)
 * @Get('popular')
 * getPopularSearches() { ... }
 */
export function CacheResponse(ttl: number = 60): MethodDecorator {
  return (target: any, key: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(CACHE_KEY_METADATA, true, descriptor.value);
    Reflect.defineMetadata(CACHE_TTL_METADATA, ttl, descriptor.value);
    return descriptor;
  };
}

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const handler = context.getHandler();

    // Check if caching is enabled for this route
    const isCacheable = this.reflector.get<boolean>(
      CACHE_KEY_METADATA,
      handler,
    );

    if (!isCacheable) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const { method, url, user } = request;

    // Only cache GET requests
    if (method !== 'GET') {
      return next.handle();
    }

    // Generate cache key from URL and user
    const cacheKey = `http:${url}:${user?.userId || 'anonymous'}`;

    // Try to get from cache
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return of(cached);
    }

    // Get TTL from metadata
    const ttl = this.reflector.get<number>(CACHE_TTL_METADATA, handler) || 60;

    // Execute request and cache result
    return next.handle().pipe(
      tap(async (response) => {
        await this.cacheService.set(cacheKey, response, ttl);
      }),
    );
  }
}
