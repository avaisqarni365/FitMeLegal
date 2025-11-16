import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { TestDataFactory } from './test-utils';

describe('Notifications API (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let accessToken: string;
  let testUser: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same configuration as production
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    // Create a test user
    testUser = await TestDataFactory.createUser();
    testUser = await prisma.user.create({ data: testUser });

    // Generate access token
    accessToken = jwtService.sign({
      userId: testUser.id,
      email: testUser.email,
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.notification.deleteMany({ where: { userId: testUser.id } });
    await prisma.notificationPreferences.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.delete({ where: { id: testUser.id } });

    await app.close();
  });

  afterEach(async () => {
    // Clean up notifications after each test
    await prisma.notification.deleteMany({ where: { userId: testUser.id } });
  });

  describe('GET /notifications', () => {
    it('should return user notifications', async () => {
      // Create test notifications
      await prisma.notification.createMany({
        data: [
          {
            userId: testUser.id,
            type: 'ORDER_CREATED',
            title: 'Order Placed',
            message: 'Your order has been placed',
            priority: 'INFO',
            isRead: false,
          },
          {
            userId: testUser.id,
            type: 'NEW_MESSAGE',
            title: 'New Message',
            message: 'You have a new message',
            priority: 'WARNING',
            isRead: false,
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.notifications).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBe(2);
    });

    it('should filter notifications by read status', async () => {
      await prisma.notification.createMany({
        data: [
          {
            userId: testUser.id,
            type: 'ORDER_CREATED',
            title: 'Order Placed',
            message: 'Test',
            isRead: false,
          },
          {
            userId: testUser.id,
            type: 'ORDER_COMPLETED',
            title: 'Order Completed',
            message: 'Test',
            isRead: true,
            readAt: new Date(),
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .get('/notifications?isRead=false')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.notifications).toHaveLength(1);
      expect(response.body.notifications[0].isRead).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/notifications')
        .expect(401);
    });
  });

  describe('GET /notifications/unread-count', () => {
    it('should return unread notification count', async () => {
      await prisma.notification.createMany({
        data: [
          {
            userId: testUser.id,
            type: 'ORDER_CREATED',
            title: 'Test 1',
            message: 'Test',
            isRead: false,
          },
          {
            userId: testUser.id,
            type: 'ORDER_CREATED',
            title: 'Test 2',
            message: 'Test',
            isRead: false,
          },
          {
            userId: testUser.id,
            type: 'ORDER_CREATED',
            title: 'Test 3',
            message: 'Test',
            isRead: true,
            readAt: new Date(),
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .get('/notifications/unread-count')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.count).toBe(2);
    });
  });

  describe('PATCH /notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const notification = await prisma.notification.create({
        data: {
          userId: testUser.id,
          type: 'ORDER_CREATED',
          title: 'Test Notification',
          message: 'Test message',
          isRead: false,
        },
      });

      const response = await request(app.getHttpServer())
        .patch(`/notifications/${notification.id}/read`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.isRead).toBe(true);
      expect(response.body.readAt).toBeDefined();

      // Verify in database
      const updated = await prisma.notification.findUnique({
        where: { id: notification.id },
      });
      expect(updated.isRead).toBe(true);
    });

    it('should return 404 for non-existent notification', async () => {
      await request(app.getHttpServer())
        .patch('/notifications/non-existent-id/read')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('POST /notifications/mark-all-read', () => {
    it('should mark all notifications as read', async () => {
      await prisma.notification.createMany({
        data: [
          {
            userId: testUser.id,
            type: 'ORDER_CREATED',
            title: 'Test 1',
            message: 'Test',
            isRead: false,
          },
          {
            userId: testUser.id,
            type: 'ORDER_CREATED',
            title: 'Test 2',
            message: 'Test',
            isRead: false,
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .post('/notifications/mark-all-read')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      expect(response.body.updated).toBe(2);

      // Verify all are marked as read
      const count = await prisma.notification.count({
        where: {
          userId: testUser.id,
          isRead: false,
        },
      });
      expect(count).toBe(0);
    });
  });

  describe('DELETE /notifications/:id', () => {
    it('should delete a notification', async () => {
      const notification = await prisma.notification.create({
        data: {
          userId: testUser.id,
          type: 'ORDER_CREATED',
          title: 'Test Notification',
          message: 'Test message',
        },
      });

      await request(app.getHttpServer())
        .delete(`/notifications/${notification.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify deletion
      const deleted = await prisma.notification.findUnique({
        where: { id: notification.id },
      });
      expect(deleted).toBeNull();
    });
  });

  describe('GET /notifications/preferences', () => {
    it('should return notification preferences', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications/preferences')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('orderUpdates');
      expect(response.body).toHaveProperty('newMessages');
      expect(response.body).toHaveProperty('meetingReminders');
    });

    it('should create default preferences if none exist', async () => {
      // Ensure no preferences exist
      await prisma.notificationPreferences.deleteMany({
        where: { userId: testUser.id },
      });

      const response = await request(app.getHttpServer())
        .get('/notifications/preferences')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.orderUpdates).toBe(true);
      expect(response.body.newMessages).toBe(true);
    });
  });

  describe('PATCH /notifications/preferences', () => {
    it('should update notification preferences', async () => {
      const response = await request(app.getHttpServer())
        .patch('/notifications/preferences')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          orderUpdates: false,
          newMessages: true,
          marketingEmails: true,
        })
        .expect(200);

      expect(response.body.orderUpdates).toBe(false);
      expect(response.body.newMessages).toBe(true);
      expect(response.body.marketingEmails).toBe(true);
    });
  });

  describe('DELETE /notifications/read/all', () => {
    it('should delete all read notifications', async () => {
      await prisma.notification.createMany({
        data: [
          {
            userId: testUser.id,
            type: 'ORDER_CREATED',
            title: 'Test 1',
            message: 'Test',
            isRead: true,
            readAt: new Date(),
          },
          {
            userId: testUser.id,
            type: 'ORDER_CREATED',
            title: 'Test 2',
            message: 'Test',
            isRead: true,
            readAt: new Date(),
          },
          {
            userId: testUser.id,
            type: 'ORDER_CREATED',
            title: 'Test 3',
            message: 'Test',
            isRead: false,
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .delete('/notifications/read/all')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.deleted).toBe(2);

      // Verify only unread remains
      const remaining = await prisma.notification.count({
        where: { userId: testUser.id },
      });
      expect(remaining).toBe(1);
    });
  });
});
