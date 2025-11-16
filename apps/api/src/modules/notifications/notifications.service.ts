import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Subject } from 'rxjs';

export interface CreateNotificationDto {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  priority?: 'INFO' | 'WARNING' | 'URGENT';
  category?: string;
  actionUrl?: string;
  actionText?: string;
  groupKey?: string;
}

export interface NotificationFilters {
  isRead?: boolean;
  type?: string;
  priority?: string;
  category?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  // SSE subjects for real-time notifications (keyed by userId)
  private notificationStreams = new Map<string, Subject<any>>();

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new notification
   */
  async createNotification(dto: CreateNotificationDto) {
    const { userId, type, title, message, data, priority, category, actionUrl, actionText, groupKey } = dto;

    // Check user preferences
    const canSend = await this.checkUserPreferences(userId, type);
    if (!canSend) {
      this.logger.log(`Notification blocked by user preferences: ${type} for user ${userId}`);
      return null;
    }

    // Create notification
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type: type as any,
        title,
        message,
        data: data || {},
        priority: priority || 'INFO',
        category,
        actionUrl,
        actionText,
        groupKey,
      },
    });

    this.logger.log(`Notification created: ${type} for user ${userId}`);

    // Send real-time update
    this.sendRealtimeNotification(userId, notification);

    return notification;
  }

  /**
   * Get user notifications with filters
   */
  async getUserNotifications(
    userId: string,
    filters: NotificationFilters = {},
    page = 1,
    limit = 50,
  ) {
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (filters.isRead !== undefined) {
      where.isRead = filters.isRead;
    }
    if (filters.type) {
      where.type = filters.type;
    }
    if (filters.priority) {
      where.priority = filters.priority;
    }
    if (filters.category) {
      where.category = filters.category;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.isRead) {
      return notification;
    }

    return this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return {
      updated: result.count,
    };
  }

  /**
   * Delete notification
   */
  async deleteNotification(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Delete all read notifications
   */
  async deleteReadNotifications(userId: string) {
    const result = await this.prisma.notification.deleteMany({
      where: {
        userId,
        isRead: true,
      },
    });

    return {
      deleted: result.count,
    };
  }

  /**
   * Get user preferences
   */
  async getPreferences(userId: string) {
    let preferences = await this.prisma.notificationPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      preferences = await this.prisma.notificationPreferences.create({
        data: { userId },
      });
    }

    return preferences;
  }

  /**
   * Update user preferences
   */
  async updatePreferences(userId: string, updates: Partial<any>) {
    const preferences = await this.prisma.notificationPreferences.upsert({
      where: { userId },
      create: { userId, ...updates },
      update: updates,
    });

    return preferences;
  }

  /**
   * Check if user allows this type of notification
   */
  private async checkUserPreferences(userId: string, type: string): Promise<boolean> {
    const preferences = await this.prisma.notificationPreferences.findUnique({
      where: { userId },
    });

    // If no preferences, create default (all enabled)
    if (!preferences) {
      await this.prisma.notificationPreferences.create({
        data: { userId },
      });
      return true;
    }

    // Map notification types to preference fields
    const preferenceMap: Record<string, keyof typeof preferences> = {
      ORDER: 'orderUpdates',
      QUESTION: 'questionAnswers',
      ANSWER: 'questionAnswers',
      MESSAGE: 'newMessages',
      MEETING: 'meetingReminders',
      SUBSCRIPTION: 'subscriptionUpdates',
      ADVISOR_APPLICATION: 'advisorApplications',
      ADVISOR_APPROVED: 'advisorApplications',
      ADVISOR_REJECTED: 'advisorApplications',
    };

    // Find matching preference
    for (const [key, field] of Object.entries(preferenceMap)) {
      if (type.includes(key)) {
        return preferences[field] as boolean;
      }
    }

    // Default: allow platform notifications
    return preferences.platformNotifications;
  }

  // ===== Real-time Notification Delivery (SSE) =====

  /**
   * Create SSE stream for user
   */
  createNotificationStream(userId: string): Subject<any> {
    let stream = this.notificationStreams.get(userId);

    if (!stream) {
      stream = new Subject<any>();
      this.notificationStreams.set(userId, stream);

      this.logger.log(`Created notification stream for user ${userId}`);
    }

    return stream;
  }

  /**
   * Remove SSE stream
   */
  removeNotificationStream(userId: string) {
    const stream = this.notificationStreams.get(userId);
    if (stream) {
      stream.complete();
      this.notificationStreams.delete(userId);
      this.logger.log(`Removed notification stream for user ${userId}`);
    }
  }

  /**
   * Send real-time notification via SSE
   */
  private sendRealtimeNotification(userId: string, notification: any) {
    const stream = this.notificationStreams.get(userId);
    if (stream) {
      stream.next({
        type: 'notification',
        data: notification,
      });
    }
  }

  // ===== Helper Methods =====

  /**
   * Create order notification
   */
  async notifyOrderUpdate(userId: string, orderDetails: any, status: string) {
    const statusMessages = {
      CREATED: {
        title: 'Order Placed',
        message: `Your order #${orderDetails.id} has been placed successfully.`,
        type: 'ORDER_CREATED',
      },
      CONFIRMED: {
        title: 'Order Confirmed',
        message: `Your order #${orderDetails.id} has been confirmed by the advisor.`,
        type: 'ORDER_CONFIRMED',
      },
      IN_PROGRESS: {
        title: 'Order In Progress',
        message: `Work has started on your order #${orderDetails.id}.`,
        type: 'ORDER_IN_PROGRESS',
      },
      DELIVERED: {
        title: 'Order Delivered',
        message: `Your order #${orderDetails.id} has been delivered. Please review.`,
        type: 'ORDER_DELIVERED',
        priority: 'WARNING' as const,
      },
      COMPLETED: {
        title: 'Order Completed',
        message: `Your order #${orderDetails.id} is complete!`,
        type: 'ORDER_COMPLETED',
      },
      CANCELLED: {
        title: 'Order Cancelled',
        message: `Your order #${orderDetails.id} has been cancelled.`,
        type: 'ORDER_CANCELLED',
        priority: 'WARNING' as const,
      },
    };

    const config = statusMessages[status] || statusMessages.CREATED;

    return this.createNotification({
      userId,
      ...config,
      category: 'orders',
      actionUrl: `/orders/${orderDetails.id}`,
      actionText: 'View Order',
      data: { orderId: orderDetails.id },
    });
  }

  /**
   * Create message notification
   */
  async notifyNewMessage(userId: string, messageDetails: any) {
    return this.createNotification({
      userId,
      type: 'NEW_MESSAGE',
      title: 'New Message',
      message: `You have a new message from ${messageDetails.senderName}.`,
      category: 'messages',
      actionUrl: `/messages/${messageDetails.conversationId}`,
      actionText: 'View Message',
      data: { messageId: messageDetails.id },
      priority: 'WARNING',
    });
  }

  /**
   * Create meeting notification
   */
  async notifyMeeting(userId: string, meetingDetails: any, type: 'SCHEDULED' | 'REMINDER' | 'STARTED' | 'CANCELLED') {
    const configs = {
      SCHEDULED: {
        title: 'Meeting Scheduled',
        message: `Your meeting "${meetingDetails.title}" is scheduled for ${meetingDetails.scheduledStart}.`,
      },
      REMINDER: {
        title: 'Meeting Reminder',
        message: `Your meeting "${meetingDetails.title}" starts in 1 hour.`,
        priority: 'WARNING' as const,
      },
      STARTED: {
        title: 'Meeting Started',
        message: `Your meeting "${meetingDetails.title}" has started.`,
        priority: 'URGENT' as const,
      },
      CANCELLED: {
        title: 'Meeting Cancelled',
        message: `Your meeting "${meetingDetails.title}" has been cancelled.`,
        priority: 'WARNING' as const,
      },
    };

    const config = configs[type];

    return this.createNotification({
      userId,
      type: `MEETING_${type}`,
      ...config,
      category: 'meetings',
      actionUrl: `/meetings/${meetingDetails.id}`,
      actionText: type === 'STARTED' ? 'Join Meeting' : 'View Meeting',
      data: { meetingId: meetingDetails.id },
    });
  }

  /**
   * Create question answered notification
   */
  async notifyQuestionAnswered(userId: string, questionDetails: any) {
    return this.createNotification({
      userId,
      type: 'QUESTION_ANSWERED',
      title: 'Question Answered',
      message: `Your question "${questionDetails.title}" received a new answer.`,
      category: 'questions',
      actionUrl: `/questions/${questionDetails.id}`,
      actionText: 'View Answer',
      data: { questionId: questionDetails.id },
      priority: 'INFO',
    });
  }
}
