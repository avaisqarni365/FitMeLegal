import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

@Injectable()
export class CacheService implements OnModuleDestroy {
  private cache = new Map<string, CacheEntry<any>>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('CacheService');

    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  onModuleDestroy() {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.logger.debug(`Cache miss: ${key}`);
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.logger.debug(`Cache expired: ${key}`);
      return null;
    }

    this.logger.debug(`Cache hit: ${key}`);
    return entry.value as T;
  }

  /**
   * Set value in cache with TTL (in seconds)
   */
  async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    const expiresAt = Date.now() + ttl * 1000;

    this.cache.set(key, {
      value,
      expiresAt,
    });

    this.logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.logger.debug(`Cache deleted: ${key}`);
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async delPattern(pattern: string): Promise<number> {
    let count = 0;
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    if (count > 0) {
      this.logger.debug(`Cache deleted pattern: ${pattern} (${count} keys)`);
    }

    return count;
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    const size = this.cache.size;
    this.cache.clear();
    this.logger.log(`Cache cleared (${size} entries)`);
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    size: number;
    keys: string[];
    memoryUsage: string;
  }> {
    const keys = Array.from(this.cache.keys());
    const size = this.cache.size;

    // Estimate memory usage
    let memoryBytes = 0;
    for (const [key, entry] of this.cache.entries()) {
      memoryBytes += key.length * 2; // Approximate string memory
      memoryBytes += JSON.stringify(entry.value).length * 2;
    }

    return {
      size,
      keys,
      memoryUsage: `${Math.round(memoryBytes / 1024)}KB`,
    };
  }

  /**
   * Get or set pattern - fetch from cache or compute and cache
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = 300,
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttl);

    return value;
  }

  /**
   * Wrap an async function with caching
   */
  wrap<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = 300,
  ): Promise<T> {
    return this.getOrSet(key, fn, ttl);
  }

  /**
   * Check if key exists in cache
   */
  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get time to live for a key (in seconds)
   */
  async ttl(key: string): Promise<number> {
    const entry = this.cache.get(key);

    if (!entry) {
      return -1;
    }

    const remaining = entry.expiresAt - Date.now();

    if (remaining <= 0) {
      this.cache.delete(key);
      return -1;
    }

    return Math.round(remaining / 1000);
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let count = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        count++;
      }
    }

    if (count > 0) {
      this.logger.debug(`Cache cleanup removed ${count} expired entries`);
    }
  }
}
