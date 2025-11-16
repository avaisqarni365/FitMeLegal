import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ConversationFilterDto } from './dto/conversation-filter.dto';

@Injectable()
export class MessagingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new conversation with initial message
   */
  async createConversation(
    userId: string,
    createConversationDto: CreateConversationDto,
  ) {
    const { receiverId, orderId, subject, initialMessage } =
      createConversationDto;

    // Prevent self-messaging
    if (userId === receiverId) {
      throw new BadRequestException('Cannot start conversation with yourself');
    }

    // Verify receiver exists
    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      throw new NotFoundException('Receiver not found');
    }

    // Check if conversation already exists (same participants and order)
    const existingConversation = await this.prisma.conversation.findFirst({
      where: {
        OR: [
          {
            initiatorId: userId,
            receiverId,
            orderId: orderId || null,
          },
          {
            initiatorId: receiverId,
            receiverId: userId,
            orderId: orderId || null,
          },
        ],
      },
    });

    if (existingConversation) {
      // If conversation exists, just add a message to it
      const message = await this.sendMessage(
        existingConversation.id,
        userId,
        {
          content: initialMessage,
        },
      );

      return this.prisma.conversation.findUnique({
        where: { id: existingConversation.id },
        include: {
          initiator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
            },
          },
          receiver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
            },
          },
          messages: {
            take: 1,
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });
    }

    // Create new conversation with initial message
    const conversation = await this.prisma.conversation.create({
      data: {
        initiatorId: userId,
        receiverId,
        orderId,
        subject,
        lastMessageAt: new Date(),
        receiverUnread: 1, // Receiver has 1 unread message
        messages: {
          create: {
            senderId: userId,
            content: initialMessage,
          },
        },
      },
      include: {
        initiator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return conversation;
  }

  /**
   * Get all conversations for a user
   */
  async getConversations(userId: string, filterDto: ConversationFilterDto) {
    const { unreadOnly, page, limit } = filterDto;
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [{ initiatorId: userId }, { receiverId: userId }],
    };

    // Filter for unread conversations
    if (unreadOnly) {
      where.AND = [
        {
          OR: [
            { initiatorId: userId, initiatorUnread: { gt: 0 } },
            { receiverId: userId, receiverUnread: { gt: 0 } },
          ],
        },
      ];
    }

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          lastMessageAt: 'desc',
        },
        include: {
          initiator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
              role: true,
            },
          },
          receiver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
              role: true,
            },
          },
          messages: {
            take: 1,
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      }),
      this.prisma.conversation.count({ where }),
    ]);

    // Calculate unread count for current user
    const conversationsWithUnread = conversations.map((conv) => ({
      ...conv,
      unreadCount:
        conv.initiatorId === userId
          ? conv.initiatorUnread
          : conv.receiverUnread,
      otherUser:
        conv.initiatorId === userId ? conv.receiver : conv.initiator,
    }));

    return {
      data: conversationsWithUnread,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a specific conversation
   */
  async getConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        initiator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Verify user is participant
    if (
      conversation.initiatorId !== userId &&
      conversation.receiverId !== userId
    ) {
      throw new ForbiddenException('You are not part of this conversation');
    }

    const unreadCount =
      conversation.initiatorId === userId
        ? conversation.initiatorUnread
        : conversation.receiverUnread;

    const otherUser =
      conversation.initiatorId === userId
        ? conversation.receiver
        : conversation.initiator;

    return {
      ...conversation,
      unreadCount,
      otherUser,
    };
  }

  /**
   * Get messages in a conversation
   */
  async getMessages(conversationId: string, userId: string, page = 1, limit = 50) {
    // Verify user is participant
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (
      conversation.initiatorId !== userId &&
      conversation.receiverId !== userId
    ) {
      throw new ForbiddenException('You are not part of this conversation');
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    return {
      data: messages.reverse(), // Reverse to show oldest first
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(
    conversationId: string,
    userId: string,
    sendMessageDto: SendMessageDto,
  ) {
    // Verify conversation exists and user is participant
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (
      conversation.initiatorId !== userId &&
      conversation.receiverId !== userId
    ) {
      throw new ForbiddenException('You are not part of this conversation');
    }

    // Determine who is receiving the message
    const isInitiator = conversation.initiatorId === userId;

    // Create message and update conversation
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: sendMessageDto.content,
        attachments: sendMessageDto.attachments || [],
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Update conversation: increment unread count for receiver, update lastMessageAt
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        ...(isInitiator
          ? { receiverUnread: { increment: 1 } }
          : { initiatorUnread: { increment: 1 } }),
      },
    });

    return message;
  }

  /**
   * Mark all messages in a conversation as read
   */
  async markAsRead(conversationId: string, userId: string) {
    // Verify conversation exists and user is participant
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (
      conversation.initiatorId !== userId &&
      conversation.receiverId !== userId
    ) {
      throw new ForbiddenException('You are not part of this conversation');
    }

    const isInitiator = conversation.initiatorId === userId;

    // Mark all unread messages as read
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    // Reset unread count for current user
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: isInitiator
        ? { initiatorUnread: 0 }
        : { receiverUnread: 0 },
    });

    return { success: true, message: 'Marked as read' };
  }

  /**
   * Get unread message count for user
   */
  async getUnreadCount(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ initiatorId: userId }, { receiverId: userId }],
      },
      select: {
        initiatorId: true,
        receiverId: true,
        initiatorUnread: true,
        receiverUnread: true,
      },
    });

    const unreadCount = conversations.reduce((total, conv) => {
      return (
        total +
        (conv.initiatorId === userId
          ? conv.initiatorUnread
          : conv.receiverUnread)
      );
    }, 0);

    return { unreadCount };
  }
}
