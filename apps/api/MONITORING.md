# Monitoring & Logging Guide

This guide covers the logging, monitoring, and observability features of the FitMeLegal API.

## Table of Contents

- [Logging](#logging)
- [Health Checks](#health-checks)
- [Audit Logging](#audit-logging)
- [Error Tracking](#error-tracking)
- [Monitoring Best Practices](#monitoring-best-practices)

## Logging

The application uses a structured logging system built on NestJS's Logger with custom enhancements.

### Logger Service

The `LoggerService` provides structured logging with context and metadata:

```typescript
import { LoggerService } from './common/logger/logger.service';

@Injectable()
export class MyService {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('MyService');
  }

  someMethod() {
    // Basic log
    this.logger.log('Operation completed');

    // Log with context
    this.logger.log('User created', {
      userId: user.id,
      email: user.email,
    });

    // Error logging
    this.logger.error('Operation failed', error.stack, {
      userId: user.id,
      operation: 'create',
    });

    // Warning
    this.logger.warn('Slow query detected', {
      query: 'SELECT *...',
      duration: 5000,
    });

    // Debug (only in non-production)
    this.logger.debug('Processing data', {
      count: items.length,
    });
  }
}
```

### Specialized Logging Methods

#### HTTP Request Logging

Automatic HTTP request/response logging via middleware:

```typescript
// Automatically logs all HTTP requests
// Format: GET /api/users 200 - 45ms
```

#### Authentication Logging

```typescript
this.logger.logAuth('login', userId, true, {
  ip: request.ip,
  userAgent: request.get('user-agent'),
});
```

#### Security Event Logging

```typescript
this.logger.logSecurity('suspicious_activity', 'high', {
  userId: user.id,
  ip: request.ip,
  action: 'multiple_failed_logins',
});
```

#### Business Event Logging

```typescript
this.logger.logEvent('order_created', {
  orderId: order.id,
  userId: user.id,
  amount: order.total,
});
```

#### Performance Logging

```typescript
const startTime = Date.now();
// ... operation ...
const duration = Date.now() - startTime;

this.logger.logPerformance('complex_query', duration, {
  query: 'user_stats',
  resultCount: results.length,
});
```

### Log Formats

**Development Mode:**
```
[2025-11-16T10:00:00.000Z] [LOG] [MyService] Operation completed { userId: "123", email: "test@example.com" }
```

**Production Mode (JSON):**
```json
{
  "timestamp": "2025-11-16T10:00:00.000Z",
  "level": "LOG",
  "context": "MyService",
  "message": "Operation completed",
  "userId": "123",
  "email": "test@example.com"
}
```

### Log Levels

- **LOG** - General information (green)
- **ERROR** - Errors and exceptions (red)
- **WARN** - Warnings and potential issues (yellow)
- **DEBUG** - Debug information, development only (cyan)
- **VERBOSE** - Detailed information, development only (magenta)

## Health Checks

Health check endpoints for monitoring and load balancers.

### Endpoints

#### Basic Health Check

```bash
GET /health

Response:
{
  "status": "ok",
  "timestamp": "2025-11-16T10:00:00.000Z",
  "uptime": {
    "ms": 3600000,
    "formatted": "0d 1h 0m 0s"
  },
  "service": "FitMeLegal API",
  "version": "1.0.0"
}
```

#### Readiness Check

Checks if service is ready to accept traffic (includes database connectivity):

```bash
GET /health/ready

Response:
{
  "status": "ready",
  "checks": {
    "database": {
      "status": "up",
      "responseTime": "5ms"
    }
  },
  "timestamp": "2025-11-16T10:00:00.000Z"
}
```

**Use case:** Kubernetes readiness probe, load balancer health check

#### Liveness Check

Checks if service is alive (doesn't check dependencies):

```bash
GET /health/live

Response:
{
  "status": "alive",
  "timestamp": "2025-11-16T10:00:00.000Z",
  "uptime": {
    "ms": 3600000,
    "formatted": "0d 1h 0m 0s"
  }
}
```

**Use case:** Kubernetes liveness probe

#### Metrics

System metrics for monitoring:

```bash
GET /health/metrics

Response:
{
  "timestamp": "2025-11-16T10:00:00.000Z",
  "uptime": {
    "ms": 3600000,
    "formatted": "0d 1h 0m 0s"
  },
  "memory": {
    "rss": "150MB",
    "heapTotal": "100MB",
    "heapUsed": "75MB",
    "external": "2MB"
  },
  "process": {
    "pid": 12345,
    "nodeVersion": "v18.17.0",
    "platform": "linux",
    "arch": "x64"
  }
}
```

### Kubernetes Configuration

**Liveness Probe:**
```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

**Readiness Probe:**
```yaml
readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 2
```

## Audit Logging

Audit logs track administrative actions for compliance and security.

### Using Audit Service

```typescript
import { AuditService } from './common/audit/audit.service';

@Injectable()
export class AdminService {
  constructor(private readonly auditService: AuditService) {}

  async approveAdvisor(adminId: string, advisorId: string, req: Request) {
    // ... approve logic ...

    await this.auditService.logAction({
      adminId,
      action: 'APPROVE_ADVISOR',
      entityType: 'Advisor',
      entityId: advisorId,
      details: {
        previousStatus: 'PENDING',
        newStatus: 'APPROVED',
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
  }
}
```

### Audit Log Fields

- **adminId** - ID of admin who performed action
- **action** - Action type (enum: APPROVE_ADVISOR, SUSPEND_USER, etc.)
- **entityType** - Type of affected entity (User, Advisor, Service, etc.)
- **entityId** - ID of affected entity
- **details** - JSON object with additional details
- **ipAddress** - IP address of admin
- **userAgent** - User agent string
- **createdAt** - Timestamp

### Retrieving Audit Logs

```typescript
// Get audit logs with filters
const result = await this.auditService.getAuditLogs({
  adminId: 'admin-123',
  action: 'APPROVE_ADVISOR',
  entityType: 'Advisor',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-12-31'),
  page: 1,
  limit: 50,
});

// Get audit statistics
const stats = await this.auditService.getAuditStats(
  new Date('2025-01-01'),
  new Date('2025-12-31')
);
```

### Audit Statistics

```typescript
{
  totalActions: 1523,
  actionsByType: [
    { action: 'APPROVE_ADVISOR', count: 450 },
    { action: 'SUSPEND_USER', count: 23 },
    // ...
  ],
  topAdmins: [
    { adminId: 'admin-1', count: 500 },
    { adminId: 'admin-2', count: 350 },
    // ...
  ]
}
```

## Error Tracking

All exceptions are automatically caught and logged by the global exception filter.

### Automatic Error Logging

The `AllExceptionsFilter` automatically:

1. **Logs all exceptions** with full context
2. **Categorizes errors** (client errors 4xx vs server errors 5xx)
3. **Includes stack traces** in development
4. **Returns structured error responses**

### Error Response Format

```json
{
  "statusCode": 500,
  "timestamp": "2025-11-16T10:00:00.000Z",
  "path": "/api/users/123",
  "method": "GET",
  "error": "Internal Server Error",
  "message": "Database connection failed",
  "stack": "Error: Database connection failed\n  at ..." // Development only
}
```

### Integration with Error Tracking Services

#### Sentry Integration (Future)

To integrate with Sentry:

```bash
npm install @sentry/node @sentry/tracing
```

```typescript
// In main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// In exception filter
if (status >= 500) {
  Sentry.captureException(exception);
}
```

## Monitoring Best Practices

### 1. Structured Logging

Always include context in logs:

```typescript
// Good
this.logger.log('Order created', {
  orderId: order.id,
  userId: user.id,
  amount: order.total,
  items: order.items.length,
});

// Bad
this.logger.log('Order created');
```

### 2. Log Levels

Use appropriate log levels:

- **ERROR** - Actual errors that need attention
- **WARN** - Potential issues (slow queries, deprecated features)
- **LOG** - Normal operations (user login, order created)
- **DEBUG** - Detailed information for debugging
- **VERBOSE** - Very detailed information

### 3. Avoid Logging Sensitive Data

Never log:
- Passwords
- Credit card numbers
- Authentication tokens
- Personal identification numbers

```typescript
// Bad
this.logger.log('User login', {
  email: user.email,
  password: password, // NEVER!
});

// Good
this.logger.log('User login', {
  userId: user.id,
  email: user.email,
});
```

### 4. Performance Monitoring

Track slow operations:

```typescript
const startTime = Date.now();
const results = await this.complexQuery();
const duration = Date.now() - startTime;

if (duration > 1000) {
  this.logger.warn('Slow query detected', {
    operation: 'complexQuery',
    duration,
    resultCount: results.length,
  });
}
```

### 5. Error Context

Include full context in error logs:

```typescript
try {
  await this.processOrder(orderId);
} catch (error) {
  this.logger.error('Order processing failed', error.stack, {
    orderId,
    userId: order.userId,
    amount: order.total,
    step: 'payment',
  });
  throw error;
}
```

### 6. Health Check Monitoring

Set up monitoring alerts:

- Alert when `/health/ready` returns non-200 status
- Alert when `/health/metrics` shows high memory usage
- Alert when uptime resets unexpectedly

### 7. Log Aggregation

In production, use log aggregation tools:

- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **CloudWatch Logs** (AWS)
- **Google Cloud Logging**
- **Datadog**
- **Splunk**

The structured JSON logs are ready for ingestion by these tools.

### 8. Metrics Dashboard

Monitor key metrics:

- **Request rate** (requests per second)
- **Error rate** (errors per second, percentage)
- **Response time** (p50, p95, p99)
- **Database query time**
- **Memory usage**
- **CPU usage**

## Environment Variables

Configure logging behavior:

```env
# Log level (error, warn, log, debug, verbose)
LOG_LEVEL=log

# Enable JSON logging (production)
LOG_FORMAT=json

# Sentry DSN for error tracking
SENTRY_DSN=https://...

# Enable request logging
ENABLE_REQUEST_LOGGING=true
```

## Troubleshooting

### Logs Not Appearing

Check that logger is properly injected:

```typescript
constructor(private readonly logger: LoggerService) {
  this.logger.setContext('MyService');
}
```

### Health Check Failing

Check database connectivity:

```bash
# Test database connection
npm run prisma:studio

# Check database URL
echo $DATABASE_URL
```

### High Memory Usage

Check metrics endpoint:

```bash
curl http://localhost:3000/health/metrics
```

Look for memory leaks in application code.

## Production Checklist

- [ ] Environment variables configured
- [ ] Log aggregation set up
- [ ] Error tracking service configured (Sentry)
- [ ] Health check endpoints monitored
- [ ] Alerts configured for errors and downtime
- [ ] Audit logs being reviewed regularly
- [ ] Sensitive data not being logged
- [ ] Performance metrics tracked
