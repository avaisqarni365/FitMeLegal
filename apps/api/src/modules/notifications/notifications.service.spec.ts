import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
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

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      const notificationData = {
        userId: 'user-123',
        type: 'ORDER_CREATED',
        title: 'Order Placed',
        message: 'Your order has been placed',
        priority: 'INFO' as const,
      };

      const mockPreferences = {
        userId: 'user-123',
        orderUpdates: true,
        platformNotifications: true,
      };

      const mockNotification = TestDataFactory.createNotification(notificationData);

      prisma.notificationPreferences.findUnique.mockResolvedValue(mockPreferences);
      prisma.notification.create.mockResolvedValue(mockNotification);

      const result = await service.createNotification(notificationData);

      expect(result).toEqual(mockNotification);
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
          type: 'ORDER_CREATED',
          title: 'Order Placed',
        }),
      });
    });

    it('should not create notification if user preferences block it', async () => {
      const notificationData = {
        userId: 'user-123',
        type: 'ORDER_CREATED',
        title: 'Order Placed',
        message: 'Your order has been placed',
      };

      const mockPreferences = {
        userId: 'user-123',
        orderUpdates: false, // User disabled order updates
        platformNotifications: true,
      };

      prisma.notificationPreferences.findUnique.mockResolvedValue(mockPreferences);

      const result = await service.createNotification(notificationData);

      expect(result).toBeNull();
      expect(prisma.notification.create).not.toHaveBeenCalled();
    });

    it('should create notification with default preferences if none exist', async () => {
      const notificationData = {
        userId: 'user-123',
        type: 'SYSTEM_ANNOUNCEMENT',
        title: 'System Update',
        message: 'System will be updated',
      };

      const mockNotification = TestDataFactory.createNotification(notificationData);

      prisma.notificationPreferences.findUnique.mockResolvedValue(null);
      prisma.notificationPreferences.create.mockResolvedValue({
        userId: 'user-123',
        orderUpdates: true,
        platformNotifications: true,
      });
      prisma.notification.create.mockResolvedValue(mockNotification);

      const result = await service.createNotification(notificationData);

      expect(result).toEqual(mockNotification);
      expect(prisma.notificationPreferences.create).toHaveBeenCalled();
    });
  });

  describe('getUserNotifications', () => {
    it('should get user notifications with pagination', async () => {
      const userId = 'user-123';
      const mockNotifications = [
        TestDataFactory.createNotification({ userId }),
        TestDataFactory.createNotification({ userId }),
      ];

      prisma.notification.findMany.mockResolvedValue(mockNotifications);
      prisma.notification.count.mockResolvedValue(2);

      const result = await service.getUserNotifications(userId, {}, 1, 10);

      expect(result.notifications).toEqual(mockNotifications);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });
    });

    it('should filter notifications by read status', async () => {
      const userId = 'user-123';
      const mockNotifications = [
        TestDataFactory.createNotification({ userId, isRead: false }),
      ];

      prisma.notification.findMany.mockResolvedValue(mockNotifications);
      prisma.notification.count.mockResolvedValue(1);

      await service.getUserNotifications(userId, { isRead: false }, 1, 10);

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          isRead: false,
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      const userId = 'user-123';
      prisma.notification.count.mockResolvedValue(5);

      const count = await service.getUnreadCount(userId);

      expect(count).toBe(5);
      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: {
          userId,
          isRead: false,
        },
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notificationId = 'notif-123';
      const userId = 'user-123';
      const mockNotification = TestDataFactory.createNotification({
        id: notificationId,
        userId,
        isRead: false,
      });

      const updatedNotification = { ...mockNotification, isRead: true, readAt: new Date() };

      prisma.notification.findFirst.mockResolvedValue(mockNotification);
      prisma.notification.update.mockResolvedValue(updatedNotification);

      const result = await service.markAsRead(notificationId, userId);

      expect(result.isRead).toBe(true);
      expect(result.readAt).toBeDefined();
      expect(prisma.notification.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if notification not found', async () => {
      prisma.notification.findFirst.mockResolvedValue(null);

      await expect(service.markAsRead('notif-123', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should not update if notification already read', async () => {
      const mockNotification = TestDataFactory.createNotification({
        isRead: true,
        readAt: new Date(),
      });

      prisma.notification.findFirst.mockResolvedValue(mockNotification);

      const result = await service.markAsRead('notif-123', 'user-123');

      expect(result).toEqual(mockNotification);
      expect(prisma.notification.update).not.toHaveBeenCalled();
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      const userId = 'user-123';
      prisma.notification.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.markAllAsRead(userId);

      expect(result.updated).toBe(3);
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: expect.any(Date),
        },
      });
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      const notificationId = 'notif-123';
      const userId = 'user-123';
      const mockNotification = TestDataFactory.createNotification({ id: notificationId, userId });

      prisma.notification.findFirst.mockResolvedValue(mockNotification);
      prisma.notification.delete.mockResolvedValue(mockNotification);

      const result = await service.deleteNotification(notificationId, userId);

      expect(result.success).toBe(true);
      expect(prisma.notification.delete).toHaveBeenCalledWith({
        where: { id: notificationId },
      });
    });

    it('should throw NotFoundException if notification not found', async () => {
      prisma.notification.findFirst.mockResolvedValue(null);

      await expect(service.deleteNotification('notif-123', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('notifyOrderUpdate', () => {
    it('should create notification for order creation', async () => {
      const userId = 'user-123';
      const orderDetails = { id: 'order-456' };
      const mockNotification = TestDataFactory.createNotification();

      prisma.notificationPreferences.findUnique.mockResolvedValue({
        orderUpdates: true,
        platformNotifications: true,
      });
      prisma.notification.create.mockResolvedValue(mockNotification);

      const result = await service.notifyOrderUpdate(userId, orderDetails, 'CREATED');

      expect(result).toEqual(mockNotification);
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          type: 'ORDER_CREATED',
          title: 'Order Placed',
          category: 'orders',
          actionUrl: `/orders/${orderDetails.id}`,
        }),
      });
    });

    it('should set WARNING priority for delivered orders', async () => {
      const userId = 'user-123';
      const orderDetails = { id: 'order-456' };

      prisma.notificationPreferences.findUnique.mockResolvedValue({
        orderUpdates: true,
      });
      prisma.notification.create.mockResolvedValue({});

      await service.notifyOrderUpdate(userId, orderDetails, 'DELIVERED');

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          priority: 'WARNING',
        }),
      });
    });
  });

  describe('notifyNewMessage', () => {
    it('should create notification for new message', async () => {
      const userId = 'user-123';
      const messageDetails = {
        id: 'msg-456',
        senderName: 'John Doe',
        conversationId: 'conv-789',
      };

      prisma.notificationPreferences.findUnique.mockResolvedValue({
        newMessages: true,
      });
      prisma.notification.create.mockResolvedValue({});

      await service.notifyNewMessage(userId, messageDetails);

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          type: 'NEW_MESSAGE',
          title: 'New Message',
          message: expect.stringContaining('John Doe'),
          category: 'messages',
          priority: 'WARNING',
        }),
      });
    });
  });

  describe('getPreferences', () => {
    it('should return existing preferences', async () => {
      const userId = 'user-123';
      const mockPreferences = {
        userId,
        orderUpdates: true,
        newMessages: true,
      };

      prisma.notificationPreferences.findUnique.mockResolvedValue(mockPreferences);

      const result = await service.getPreferences(userId);

      expect(result).toEqual(mockPreferences);
    });

    it('should create default preferences if none exist', async () => {
      const userId = 'user-123';
      const defaultPreferences = {
        userId,
        orderUpdates: true,
        newMessages: true,
      };

      prisma.notificationPreferences.findUnique.mockResolvedValue(null);
      prisma.notificationPreferences.create.mockResolvedValue(defaultPreferences);

      const result = await service.getPreferences(userId);

      expect(result).toEqual(defaultPreferences);
      expect(prisma.notificationPreferences.create).toHaveBeenCalledWith({
        data: { userId },
      });
    });
  });

  describe('updatePreferences', () => {
    it('should update notification preferences', async () => {
      const userId = 'user-123';
      const updates = {
        orderUpdates: false,
        newMessages: true,
      };

      prisma.notificationPreferences.upsert.mockResolvedValue({
        userId,
        ...updates,
      });

      const result = await service.updatePreferences(userId, updates);

      expect(result).toMatchObject(updates);
      expect(prisma.notificationPreferences.upsert).toHaveBeenCalledWith({
        where: { userId },
        create: { userId, ...updates },
        update: updates,
      });
    });
  });
});
