# Performance Optimization & Caching Guide

This guide covers the performance optimization and caching features implemented in the FitMeLegal API.

## Table of Contents

- [Overview](#overview)
- [Caching System](#caching-system)
  - [CacheService](#cacheservice)
  - [Cache Decorators](#cache-decorators)
  - [HTTP Response Caching](#http-response-caching)
- [Performance Monitoring](#performance-monitoring)
  - [Performance Interceptor](#performance-interceptor)
  - [Database Query Monitoring](#database-query-monitoring)
- [Query Optimization](#query-optimization)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The FitMeLegal API implements a multi-layer caching and performance monitoring system to ensure optimal response times and efficient resource usage.

### Key Features

- **In-Memory Caching**: Fast caching with automatic TTL management
- **Cache Decorators**: Simple method-level caching with `@Cacheable`
- **HTTP Response Caching**: Automatic caching of GET requests
- **Performance Monitoring**: Real-time tracking of slow requests and queries
- **Database Query Optimization**: Prisma middleware for query performance
- **Automatic Cleanup**: Expired cache entries are automatically removed

## Caching System

### CacheService

The `CacheService` provides an in-memory caching layer with TTL (Time To Live) support.

#### Basic Usage

```typescript
import { CacheService } from './common/cache/cache.service';

@Injectable()
export class MyService {
  constructor(private cacheService: CacheService) {}

  async getData(id: string) {
    // Try to get from cache
    const cached = await this.cacheService.get<MyData>(`data:${id}`);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const data = await this.fetchFromDatabase(id);

    // Store in cache for 5 minutes
    await this.cacheService.set(`data:${id}`, data, 300);

    return data;
  }
}
```

#### getOrSet Pattern

The `getOrSet` method simplifies the cache-or-fetch pattern:

```typescript
async getData(id: string) {
  return this.cacheService.getOrSet(
    `data:${id}`,
    () => this.fetchFromDatabase(id),
    300 // TTL in seconds
  );
}
```

#### Cache Invalidation

```typescript
// Delete a specific key
await this.cacheService.del('user:123');

// Delete all keys matching a pattern
await this.cacheService.delPattern('user:*');
await this.cacheService.delPattern('users:page:*');
```

#### Cache Statistics

```typescript
const stats = await this.cacheService.getStats();
console.log(stats);
// {
//   size: 42,
//   keys: ['user:123', 'users:page:1', ...],
//   hitRate: 0.85
// }
```

#### Cache Management

```typescript
// Clear all cache entries
await this.cacheService.clear();

// Check if a key exists
const exists = await this.cacheService.has('user:123');
```

### Cache Decorators

The `@Cacheable` and `@CacheInvalidate` decorators provide declarative caching for service methods.

#### @Cacheable

Automatically caches the result of a method:

```typescript
import { Cacheable } from './common/decorators/cacheable.decorator';

@Injectable()
export class UsersService {
  constructor(private cacheService: CacheService) {}

  @Cacheable({ key: 'user', ttl: 300 })
  async getUser(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  @Cacheable({
    key: 'users',
    ttl: 60,
    keyGenerator: (page, limit) => `${page}:${limit}`
  })
  async getUsers(page: number, limit: number) {
    return this.prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit
    });
  }
}
```

**How it works:**
- First call: Executes method, stores result in cache as `user:{id}`
- Subsequent calls: Returns cached value until TTL expires
- Default TTL: 300 seconds (5 minutes)
- Custom key generator: Use for complex cache keys

#### @CacheInvalidate

Automatically invalidates cache entries after a method executes:

```typescript
import { CacheInvalidate } from './common/decorators/cacheable.decorator';

@Injectable()
export class UsersService {
  constructor(private cacheService: CacheService) {}

  @CacheInvalidate({ keys: ['user', 'users'] })
  async updateUser(id: string, data: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data
    });
  }

  @CacheInvalidate({ keys: ['users'] })
  async createUser(data: CreateUserDto) {
    return this.prisma.user.create({ data });
  }

  @CacheInvalidate({ keys: ['user'], pattern: false })
  async deleteUser(id: string) {
    await this.cacheService.del(`user:${id}`); // Specific key only
    return this.prisma.user.delete({ where: { id } });
  }
}
```

**How it works:**
- Executes the method first
- On success, invalidates specified cache keys
- Pattern matching: `pattern: true` (default) invalidates `key:*`
- Exact match: `pattern: false` invalidates exact key only

### HTTP Response Caching

The `CacheInterceptor` and `@CacheResponse` decorator provide HTTP-level caching.

#### Controller Usage

```typescript
import { Controller, Get, Param } from '@nestjs/common';
import { CacheResponse } from './common/interceptors/cache.interceptor';

@Controller('advisors')
export class AdvisorsController {
  constructor(private advisorsService: AdvisorsService) {}

  @Get()
  @CacheResponse(60) // Cache for 60 seconds
  async findAll() {
    return this.advisorsService.findAll();
  }

  @Get(':id')
  @CacheResponse(300) // Cache for 5 minutes
  async findOne(@Param('id') id: string) {
    return this.advisorsService.findOne(id);
  }
}
```

**Features:**
- Only caches GET requests
- Ignores authenticated requests by default (configurable)
- Automatic cache key generation from URL and query params
- Returns cached responses with appropriate headers

## Performance Monitoring

### Performance Interceptor

The `PerformanceInterceptor` automatically tracks and logs slow requests.

#### How It Works

```typescript
// Automatically registered in app.module.ts
{
  provide: APP_INTERCEPTOR,
  useFactory: (logger: LoggerService) => new PerformanceInterceptor(logger),
  inject: [LoggerService],
}
```

**Thresholds:**
- **Warning**: Requests taking > 1 second
- **Error**: Requests taking > 5 seconds

**Log Output:**
```json
{
  "level": "warn",
  "message": "Slow request detected: GET /api/advisors",
  "context": "PerformanceInterceptor",
  "duration": 1250,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Benefits

- Identifies performance bottlenecks
- Tracks API response times
- No code changes required
- Production-ready logging

### Database Query Monitoring

The Prisma performance middleware tracks slow database queries.

#### How It Works

```typescript
// Automatically registered in PrismaService
this.$use(createPerformanceMiddleware(this.logger));
```

**Thresholds:**
- **Warning**: Queries taking > 100ms
- **Error**: Queries taking > 1 second

**Log Output:**
```json
{
  "level": "warn",
  "message": "Slow database query detected",
  "context": "PrismaService",
  "model": "User",
  "action": "findMany",
  "duration": 150,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Query Optimization Tips

The middleware logs include suggestions:

```typescript
// Logged with slow queries
{
  "suggestions": [
    "Add index on frequently queried fields",
    "Use select to fetch only needed fields",
    "Consider pagination for large result sets",
    "Use include judiciously to avoid N+1 queries"
  ]
}
```

## Query Optimization

### QueryOptimizer Utility

The `QueryOptimizer` class provides best practices for Prisma queries:

```typescript
import { QueryOptimizer } from './prisma/prisma-performance.middleware';

// 1. Use select to fetch only needed fields
const users = await prisma.user.findMany(
  QueryOptimizer.selectFields(['id', 'email', 'firstName'])
);

// 2. Implement pagination
const paginatedUsers = await prisma.user.findMany(
  QueryOptimizer.paginate(page, limit)
);

// 3. Add indexes for frequently queried fields
// In schema.prisma:
// @@index([email])
// @@index([createdAt])
```

### Common Optimization Patterns

#### 1. Avoid N+1 Queries

**Bad:**
```typescript
const users = await prisma.user.findMany();
for (const user of users) {
  user.profile = await prisma.profile.findUnique({
    where: { userId: user.id }
  });
}
```

**Good:**
```typescript
const users = await prisma.user.findMany({
  include: {
    profile: true
  }
});
```

#### 2. Use Select for Specific Fields

**Bad:**
```typescript
const users = await prisma.user.findMany(); // Fetches all fields
```

**Good:**
```typescript
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    firstName: true,
    lastName: true
  }
});
```

#### 3. Implement Pagination

**Bad:**
```typescript
const allUsers = await prisma.user.findMany(); // Could be millions
```

**Good:**
```typescript
const users = await prisma.user.findMany({
  skip: (page - 1) * limit,
  take: limit
});
```

#### 4. Use Indexes

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  createdAt DateTime @default(now())

  @@index([email])      // Fast email lookups
  @@index([createdAt])  // Fast date range queries
}
```

#### 5. Batch Operations

**Bad:**
```typescript
for (const user of users) {
  await prisma.user.update({
    where: { id: user.id },
    data: { verified: true }
  });
}
```

**Good:**
```typescript
await prisma.user.updateMany({
  where: {
    id: { in: users.map(u => u.id) }
  },
  data: { verified: true }
});
```

## Best Practices

### Caching Strategies

#### 1. Cache Read-Heavy Data

Cache data that's read frequently but updated rarely:

```typescript
// Good candidates for caching
@Cacheable({ key: 'advisor-profile', ttl: 300 })
async getAdvisorProfile(id: string) { ... }

@Cacheable({ key: 'service-categories', ttl: 3600 })
async getServiceCategories() { ... }
```

#### 2. Short TTL for Dynamic Data

Use shorter TTLs for frequently changing data:

```typescript
// User notifications - 1 minute TTL
@Cacheable({ key: 'user-notifications', ttl: 60 })
async getUserNotifications(userId: string) { ... }

// Search results - 5 minute TTL
@Cacheable({ key: 'search-results', ttl: 300 })
async search(query: string) { ... }
```

#### 3. Cache Invalidation

Always invalidate cache when data changes:

```typescript
@CacheInvalidate({ keys: ['advisor-profile', 'advisors-list'] })
async updateAdvisor(id: string, data: UpdateAdvisorDto) { ... }
```

#### 4. Avoid Caching Large Objects

```typescript
// Bad: Caching entire user object with relations
@Cacheable({ key: 'user-full', ttl: 300 })
async getUserWithAllRelations(id: string) {
  return this.prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      orders: true,
      reviews: true,
      notifications: true,
      // Too much data!
    }
  });
}

// Good: Cache only what's needed
@Cacheable({ key: 'user-basic', ttl: 300 })
async getUserBasicInfo(id: string) {
  return this.prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true
    }
  });
}
```

### Performance Guidelines

#### 1. Monitor Cache Hit Rates

```typescript
// Periodically check cache effectiveness
const stats = await this.cacheService.getStats();
if (stats.hitRate < 0.5) {
  // Consider adjusting TTL or cache keys
}
```

#### 2. Set Appropriate TTLs

- **Static content**: 1 hour - 24 hours
- **User data**: 5-15 minutes
- **Search results**: 1-5 minutes
- **Real-time data**: Don't cache or 30 seconds max

#### 3. Use Caching Layers

```typescript
// Layer 1: Application cache (CacheService)
// Layer 2: Database query cache (Prisma)
// Layer 3: HTTP cache (Browser/CDN)

// Example: Public advisor profiles
@Get('advisors/:id')
@CacheResponse(300) // HTTP cache: 5 minutes
async getAdvisor(@Param('id') id: string) {
  // CacheService will cache internally
  return this.advisorsService.getAdvisor(id);
}
```

#### 4. Handle Cache Failures Gracefully

```typescript
async getUser(id: string) {
  try {
    const cached = await this.cacheService.get(`user:${id}`);
    if (cached) return cached;
  } catch (error) {
    // Log but don't fail - fetch from database
    this.logger.warn('Cache fetch failed', error);
  }

  const user = await this.prisma.user.findUnique({ where: { id } });

  try {
    await this.cacheService.set(`user:${id}`, user, 300);
  } catch (error) {
    // Log but don't fail - return user anyway
    this.logger.warn('Cache set failed', error);
  }

  return user;
}
```

## Troubleshooting

### Common Issues

#### 1. Cache Not Working

**Problem:** Decorated methods not caching

**Solution:** Ensure `cacheService` is injected:

```typescript
@Injectable()
export class MyService {
  // Must inject as 'cacheService' for decorators
  constructor(private cacheService: CacheService) {}
}
```

#### 2. Stale Cache Data

**Problem:** Seeing old data after updates

**Solution:** Add cache invalidation:

```typescript
@CacheInvalidate({ keys: ['user', 'users'] })
async updateUser(id: string, data: UpdateUserDto) { ... }
```

#### 3. Memory Usage

**Problem:** High memory consumption

**Solutions:**
- Reduce TTL values
- Clear cache periodically
- Avoid caching large objects
- Monitor with `getStats()`

```typescript
// Scheduled cleanup (if needed)
@Cron('0 */6 * * *') // Every 6 hours
async cleanupCache() {
  await this.cacheService.clear();
  this.logger.log('Cache cleared');
}
```

#### 4. Slow Performance Despite Caching

**Checklist:**
- [ ] Check cache hit rate with `getStats()`
- [ ] Verify TTL is appropriate
- [ ] Ensure cache keys are correct
- [ ] Check database query performance
- [ ] Review Prisma query includes/selects
- [ ] Verify indexes exist on queried fields

#### 5. Performance Interceptor Not Logging

**Problem:** Not seeing performance logs

**Solution:** Check log level configuration:

```typescript
// In .env file
LOG_LEVEL=debug # or 'info' in production

// Verify interceptor is registered in app.module.ts
{
  provide: APP_INTERCEPTOR,
  useFactory: (logger: LoggerService) => new PerformanceInterceptor(logger),
  inject: [LoggerService],
}
```

### Debugging

#### Enable Debug Logging

```typescript
// In development, enable detailed cache logging
this.cacheService.set('debug:enabled', true);
```

#### Monitor Cache Operations

```typescript
// Log all cache operations
const originalGet = this.cacheService.get.bind(this.cacheService);
this.cacheService.get = async (key: string) => {
  console.log(`[Cache] GET ${key}`);
  const result = await originalGet(key);
  console.log(`[Cache] ${result ? 'HIT' : 'MISS'} ${key}`);
  return result;
};
```

## Environment Variables

```env
# Caching
CACHE_TTL=300                    # Default TTL in seconds
CACHE_MAX_SIZE=1000              # Maximum cache entries

# Performance
PERF_SLOW_REQUEST_THRESHOLD=1000 # Log requests slower than 1s
PERF_SLOW_QUERY_THRESHOLD=100    # Log queries slower than 100ms

# Monitoring
LOG_LEVEL=info                   # Log level (debug, info, warn, error)
```

## Migration Path

### From No Caching

1. Start with HTTP response caching on read endpoints
2. Add method-level caching for expensive operations
3. Implement cache invalidation for write operations
4. Monitor cache hit rates and adjust TTLs

### From Redis to In-Memory

The current implementation uses in-memory caching. To migrate to Redis:

```typescript
// Replace CacheService implementation with Redis
import { Redis } from 'ioredis';

@Injectable()
export class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  // ... other methods
}
```

## Performance Benchmarks

### Expected Improvements

- **Cache Hit**: 1-5ms response time
- **Cache Miss**: 50-200ms (database query)
- **Uncached**: 100-500ms

### Measuring Performance

```typescript
// Add to any controller/service
const start = Date.now();
const result = await this.getData();
const duration = Date.now() - start;
this.logger.log(`Operation took ${duration}ms`);
```

## Further Reading

- [NestJS Caching](https://docs.nestjs.com/techniques/caching)
- [Prisma Performance](https://www.prisma.io/docs/guides/performance-and-optimization)
- [HTTP Caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [Cache Invalidation Strategies](https://aws.amazon.com/caching/best-practices/)

---

**Last Updated:** Phase 4 Week 3
**Next Steps:** Implement Redis for distributed caching, Add cache warming, Set up cache monitoring dashboard
