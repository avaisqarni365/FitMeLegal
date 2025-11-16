/**
 * Cacheable decorator for caching method results
 *
 * Usage:
 * @Cacheable({ key: 'user', ttl: 300 })
 * async getUser(id: string) { ... }
 *
 * This will cache the result with key 'user:{id}' for 300 seconds
 */

export interface CacheableOptions {
  /** Cache key prefix */
  key: string;
  /** Time to live in seconds (default: 300) */
  ttl?: number;
  /** Generate custom cache key from arguments */
  keyGenerator?: (...args: any[]) => string;
}

export function Cacheable(options: CacheableOptions): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Get cache service from instance
      const cacheService = (this as any).cacheService;

      if (!cacheService) {
        // If no cache service, just call original method
        return originalMethod.apply(this, args);
      }

      // Generate cache key
      const cacheKey = options.keyGenerator
        ? `${options.key}:${options.keyGenerator(...args)}`
        : `${options.key}:${args.join(':')}`;

      // Try to get from cache
      const cached = await cacheService.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Call original method
      const result = await originalMethod.apply(this, args);

      // Store in cache
      await cacheService.set(cacheKey, result, options.ttl || 300);

      return result;
    };

    return descriptor;
  };
}

/**
 * Cache invalidation decorator
 *
 * Usage:
 * @CacheInvalidate({ keys: ['user', 'users'] })
 * async updateUser(id: string, data: any) { ... }
 *
 * This will invalidate cache keys matching 'user:*' and 'users:*'
 */
export interface CacheInvalidateOptions {
  /** Cache key prefixes to invalidate */
  keys: string[];
  /** Whether to use pattern matching (default: true) */
  pattern?: boolean;
}

export function CacheInvalidate(options: CacheInvalidateOptions): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Call original method first
      const result = await originalMethod.apply(this, args);

      // Get cache service from instance
      const cacheService = (this as any).cacheService;

      if (cacheService) {
        // Invalidate cache keys
        for (const key of options.keys) {
          if (options.pattern !== false) {
            await cacheService.delPattern(`${key}:*`);
          } else {
            await cacheService.del(key);
          }
        }
      }

      return result;
    };

    return descriptor;
  };
}
