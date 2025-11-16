# Testing Guide

This guide explains how to write and run tests for the FitMeLegal API.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Writing Unit Tests](#writing-unit-tests)
- [Writing Integration Tests](#writing-integration-tests)
- [Test Utilities](#test-utilities)
- [Best Practices](#best-practices)
- [Coverage](#coverage)

## Overview

The FitMeLegal API uses Jest as the testing framework. We have two types of tests:

1. **Unit Tests** (`.spec.ts` files) - Test individual components in isolation
2. **Integration/E2E Tests** (`.e2e-spec.ts` files) - Test API endpoints end-to-end

## Test Structure

```
apps/api/
├── src/
│   └── modules/
│       └── [module]/
│           ├── [module].service.ts
│           ├── [module].service.spec.ts  # Unit tests
│           └── [module].controller.ts
├── test/
│   ├── setup.ts                          # Global test setup
│   ├── test-utils.ts                     # Test utilities
│   ├── jest-e2e.json                     # E2E configuration
│   └── *.e2e-spec.ts                     # E2E tests
└── jest.config.json                      # Jest configuration
```

## Running Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run tests with coverage
npm run test:cov

# Run specific test file
npm test -- notifications.service.spec.ts

# Run tests matching pattern
npm test -- --testNamePattern="should create notification"
```

## Writing Unit Tests

Unit tests test individual services, controllers, or utilities in isolation using mocked dependencies.

### Example: Service Unit Test

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { mockPrismaService, TestDataFactory } from '../../../test/test-utils';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      const notificationData = {
        userId: 'user-123',
        type: 'ORDER_CREATED',
        title: 'Order Placed',
        message: 'Your order has been placed',
      };

      const mockNotification = TestDataFactory.createNotification(notificationData);

      prisma.notificationPreferences.findUnique.mockResolvedValue({
        orderUpdates: true,
      });
      prisma.notification.create.mockResolvedValue(mockNotification);

      const result = await service.createNotification(notificationData);

      expect(result).toEqual(mockNotification);
      expect(prisma.notification.create).toHaveBeenCalled();
    });
  });
});
```

### Test Structure

Each test file should follow this structure:

1. **Imports** - Import the service/controller and dependencies
2. **describe() block** - Describe what you're testing
3. **beforeEach()** - Set up test module and mocks
4. **Nested describe() blocks** - Group related tests by method
5. **it() blocks** - Individual test cases
6. **Assertions** - Verify expected behavior

## Writing Integration Tests

Integration tests test the entire API endpoint including routing, middleware, and database.

### Example: E2E Test

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Notifications API (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Create test user and get token
    // ...
  });

  afterAll(async () => {
    // Clean up test data
    await app.close();
  });

  describe('GET /notifications', () => {
    it('should return user notifications', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.notifications).toBeDefined();
    });
  });
});
```

### E2E Test Best Practices

1. **Use beforeAll/afterAll** - Set up and tear down the app once
2. **Clean up data** - Remove test data after tests
3. **Use real database** - Use a test database, not mocks
4. **Test authentication** - Include auth tokens in requests
5. **Test error cases** - Verify 400, 401, 404 responses

## Test Utilities

We provide several utilities to make testing easier:

### mockPrismaService

Mock Prisma client with all common methods:

```typescript
import { mockPrismaService } from '../../../test/test-utils';

// In your test
prisma.user.findUnique.mockResolvedValue(mockUser);
prisma.notification.create.mockResolvedValue(mockNotification);
```

### TestDataFactory

Generate test data easily:

```typescript
import { TestDataFactory } from '../../../test/test-utils';

const user = await TestDataFactory.createUser({
  email: 'custom@example.com',
});

const advisor = TestDataFactory.createAdvisor({
  verified: true,
  averageRating: 5.0,
});

const notification = TestDataFactory.createNotification({
  type: 'ORDER_CREATED',
  isRead: false,
});
```

### TestApiClient

Make authenticated API requests:

```typescript
import { TestApiClient } from '../../../test/test-utils';

const client = new TestApiClient(app, accessToken);

await client.get('/notifications').expect(200);
await client.post('/notifications', { ... }).expect(201);
await client.patch('/notifications/123', { ... }).expect(200);
await client.delete('/notifications/123').expect(200);
```

### cleanupTestDatabase

Clean up all test data:

```typescript
import { cleanupTestDatabase } from '../../../test/test-utils';

afterAll(async () => {
  await cleanupTestDatabase(prisma);
  await app.close();
});
```

## Best Practices

### 1. Test Naming

Use descriptive test names that explain what's being tested:

```typescript
// Good
it('should create a notification when user preferences allow it', ...);
it('should return 404 when notification does not exist', ...);

// Bad
it('works', ...);
it('test notification', ...);
```

### 2. Arrange-Act-Assert Pattern

Structure tests clearly:

```typescript
it('should mark notification as read', async () => {
  // Arrange - Set up test data and mocks
  const notification = TestDataFactory.createNotification({ isRead: false });
  prisma.notification.findFirst.mockResolvedValue(notification);
  prisma.notification.update.mockResolvedValue({ ...notification, isRead: true });

  // Act - Execute the code being tested
  const result = await service.markAsRead('notif-123', 'user-123');

  // Assert - Verify the results
  expect(result.isRead).toBe(true);
  expect(prisma.notification.update).toHaveBeenCalled();
});
```

### 3. Test One Thing

Each test should verify one specific behavior:

```typescript
// Good - Tests one thing
it('should create notification', ...);
it('should send real-time update', ...);

// Bad - Tests multiple things
it('should create notification and send update and log event', ...);
```

### 4. Mock External Dependencies

Always mock external services (APIs, email, file storage):

```typescript
// Mock email service
const mockEmailService = {
  sendEmail: jest.fn().mockResolvedValue(true),
};

// Mock file storage
const mockStorageService = {
  upload: jest.fn().mockResolvedValue({ url: 'http://example.com/file.pdf' }),
};
```

### 5. Use beforeEach for Setup

Reset mocks and state before each test:

```typescript
beforeEach(() => {
  jest.clearAllMocks();
  // Reset any shared state
});
```

### 6. Test Edge Cases

Don't just test the happy path:

```typescript
it('should handle empty search query', ...);
it('should handle invalid notification ID', ...);
it('should handle database errors gracefully', ...);
it('should validate input data', ...);
```

### 7. Avoid Test Interdependence

Tests should not depend on other tests:

```typescript
// Bad - Tests depend on execution order
it('should create user', ...);
it('should update the created user', ...);  // Depends on previous test

// Good - Each test is independent
it('should create user', async () => {
  const user = await createUser();
  expect(user).toBeDefined();
});

it('should update user', async () => {
  const user = await createUser();  // Create own test data
  const updated = await updateUser(user.id);
  expect(updated).toBeDefined();
});
```

## Coverage

We aim for 70% code coverage across the application.

### Check Coverage

```bash
# Run tests with coverage
npm run test:cov

# View coverage report
open coverage/lcov-report/index.html
```

### Coverage Thresholds

Configured in `jest.config.json`:

```json
{
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 70,
      "lines": 70,
      "statements": 70
    }
  }
}
```

### What to Cover

Focus on testing:

1. **Business Logic** - Core service methods
2. **Error Handling** - Try/catch blocks
3. **Edge Cases** - Empty inputs, null values, etc.
4. **Validation** - Input validation logic
5. **API Endpoints** - All routes and methods

You don't need to test:

- DTOs (data transfer objects)
- Interfaces
- Entity definitions
- Module files

## Debugging Tests

### Run Single Test

```bash
npm test -- notifications.service.spec.ts
```

### Run with Debug Output

```bash
# Show console logs
npm test -- --verbose

# Run in Node debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Common Issues

**Issue: Tests timeout**
```typescript
// Increase timeout for specific test
it('should complete long operation', async () => {
  // ...
}, 10000); // 10 second timeout
```

**Issue: Mocks not working**
```typescript
// Make sure to clear mocks
beforeEach(() => {
  jest.clearAllMocks();
});
```

**Issue: Database connection**
```bash
# Make sure test database is running
docker-compose up -d postgres

# Set test database URL
export TEST_DATABASE_URL="postgresql://test:test@localhost:5432/fitmelegal_test"
```

## Continuous Integration

Tests run automatically on CI/CD:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm test
      - run: npm run test:e2e
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)
