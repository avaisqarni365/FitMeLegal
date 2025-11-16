import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';

/**
 * Create a test module with the given imports and providers
 */
export async function createTestingModule(metadata: {
  imports?: any[];
  controllers?: any[];
  providers?: any[];
}): Promise<TestingModule> {
  const module = await Test.createTestingModule(metadata).compile();
  return module;
}

/**
 * Create a full NestJS application for E2E testing
 */
export async function createTestApp(module: TestingModule): Promise<INestApplication> {
  const app = module.createNestApplication();

  // Apply the same configuration as production
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  return app;
}

/**
 * Mock Prisma Service for unit tests
 */
export const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  advisor: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  service: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  question: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  answer: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  order: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  notification: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  notificationPreferences: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  },
  searchHistory: {
    create: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  popularSearch: {
    findMany: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

/**
 * Test data factories
 */
export const TestDataFactory = {
  /**
   * Create a test user
   */
  createUser: async (overrides: Partial<any> = {}) => {
    const hashedPassword = await bcrypt.hash('password123', 10);

    return {
      id: 'test-user-' + Math.random().toString(36).substr(2, 9),
      email: `test-${Math.random().toString(36).substr(2, 9)}@example.com`,
      password: hashedPassword,
      role: 'CLIENT',
      userType: 'PRIVATE',
      firstName: 'Test',
      lastName: 'User',
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },

  /**
   * Create a test advisor
   */
  createAdvisor: (overrides: Partial<any> = {}) => {
    return {
      id: 'test-advisor-' + Math.random().toString(36).substr(2, 9),
      userId: 'test-user-id',
      bio: 'Test advisor bio',
      specialization: ['Tax Law', 'Business Law'],
      yearsOfExperience: 5,
      location: 'Berlin, Germany',
      hourlyRate: 150,
      availability: 'AVAILABLE',
      verified: true,
      status: 'APPROVED',
      averageRating: 4.5,
      totalReviews: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },

  /**
   * Create a test service
   */
  createService: (overrides: Partial<any> = {}) => {
    return {
      id: 'test-service-' + Math.random().toString(36).substr(2, 9),
      advisorId: 'test-advisor-id',
      title: 'Test Legal Service',
      description: 'Test service description',
      category: 'Business Law',
      price: 299,
      deliveryTime: 3,
      status: 'ACTIVE',
      tags: ['contract', 'business'],
      averageRating: 4.8,
      totalOrders: 25,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },

  /**
   * Create a test question
   */
  createQuestion: (overrides: Partial<any> = {}) => {
    return {
      id: 'test-question-' + Math.random().toString(36).substr(2, 9),
      userId: 'test-user-id',
      title: 'Test Legal Question',
      description: 'This is a test question description',
      category: 'Employment Law',
      status: 'OPEN',
      tags: ['employment', 'contract'],
      viewCount: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },

  /**
   * Create a test notification
   */
  createNotification: (overrides: Partial<any> = {}) => {
    return {
      id: 'test-notif-' + Math.random().toString(36).substr(2, 9),
      userId: 'test-user-id',
      type: 'ORDER_CREATED',
      title: 'Test Notification',
      message: 'This is a test notification',
      data: {},
      priority: 'INFO',
      category: 'orders',
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },
};

/**
 * Helper to generate JWT token for testing
 */
export function generateTestToken(payload: any = { userId: 'test-user-id', email: 'test@example.com' }): string {
  // In real tests, you'd use the actual JWT service
  // For now, return a mock token
  return 'Bearer test-jwt-token';
}

/**
 * Helper to make authenticated API requests
 */
export class TestApiClient {
  constructor(private app: INestApplication, private token?: string) {}

  setToken(token: string) {
    this.token = token;
    return this;
  }

  get(url: string) {
    const req = request(app.getHttpServer()).get(url);
    if (this.token) {
      req.set('Authorization', this.token);
    }
    return req;
  }

  post(url: string, body?: any) {
    const req = request(app.getHttpServer()).post(url);
    if (this.token) {
      req.set('Authorization', this.token);
    }
    if (body) {
      req.send(body);
    }
    return req;
  }

  patch(url: string, body?: any) {
    const req = request(app.getHttpServer()).patch(url);
    if (this.token) {
      req.set('Authorization', this.token);
    }
    if (body) {
      req.send(body);
    }
    return req;
  }

  delete(url: string) {
    const req = request(app.getHttpServer()).delete(url);
    if (this.token) {
      req.set('Authorization', this.token);
    }
    return req;
  }
}

/**
 * Clean up test database
 */
export async function cleanupTestDatabase(prisma: PrismaService) {
  // Delete in correct order to respect foreign key constraints
  await prisma.searchHistory.deleteMany();
  await prisma.popularSearch.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.notificationPreferences.deleteMany();
  await prisma.emailLog.deleteMany();
  await prisma.emailPreferences.deleteMany();
  await prisma.fileUpload.deleteMany();
  await prisma.answer.deleteMany();
  await prisma.question.deleteMany();
  await prisma.order.deleteMany();
  await prisma.service.deleteMany();
  await prisma.advisor.deleteMany();
  await prisma.user.deleteMany();
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100,
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error('Timeout waiting for condition');
}
