import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto, OrderStatus } from './dto/update-order.dto';
import { OrderFilterDto } from './dto/order-filter.dto';
import { RequestRevisionDto } from './dto/request-revision.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(serviceId: string, clientId: string, createOrderDto: CreateOrderDto) {
    // Get service details
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: { advisor: true },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (!service.active) {
      throw new BadRequestException('This service is not currently available');
    }

    if (!service.advisor.active || service.advisor.verificationStatus !== 'VERIFIED') {
      throw new BadRequestException('This advisor is not currently available');
    }

    // Calculate due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + service.deliveryTime);

    // Create order
    const order = await this.prisma.order.create({
      data: {
        serviceId,
        clientId,
        price: service.price,
        currency: service.currency,
        requirements: createOrderDto.requirements,
        notes: createOrderDto.notes,
        dueDate,
        status: 'PENDING',
        paymentStatus: 'PENDING',
      },
      include: {
        service: {
          include: {
            advisor: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return order;
  }

  async findAll(userId: string, userRole: string, filterDto: OrderFilterDto) {
    const { page, limit, sortBy, sortOrder, ...filters } = filterDto;
    const skip = (page - 1) * limit;

    // Build where clause based on user role
    const where: any = {};

    if (userRole === 'CLIENT') {
      where.clientId = userId;
    } else if (userRole === 'ADVISOR') {
      // Get advisor profile
      const advisor = await this.prisma.advisor.findUnique({
        where: { userId },
      });
      if (!advisor) {
        throw new NotFoundException('Advisor profile not found');
      }
      where.service = { advisorId: advisor.id };
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.serviceId) {
      where.serviceId = filters.serviceId;
    }

    // Execute query
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          service: {
            include: {
              advisor: {
                include: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
            },
          },
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string, userRole: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        service: {
          include: {
            advisor: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify access
    const isClient = order.clientId === userId;
    const isAdvisor = order.service.advisor.userId === userId;
    const isAdmin = userRole === 'ADMIN';

    if (!isClient && !isAdvisor && !isAdmin) {
      throw new ForbiddenException('You do not have access to this order');
    }

    return order;
  }

  async confirmOrder(id: string, advisorUserId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { service: { include: { advisor: true } } },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify advisor ownership
    if (order.service.advisor.userId !== advisorUserId) {
      throw new ForbiddenException('You can only confirm your own orders');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException('Only pending orders can be confirmed');
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: 'CONFIRMED' },
      include: {
        service: true,
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async startOrder(id: string, advisorUserId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { service: { include: { advisor: true } } },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify advisor ownership
    if (order.service.advisor.userId !== advisorUserId) {
      throw new ForbiddenException('You can only start your own orders');
    }

    if (order.status !== 'CONFIRMED') {
      throw new BadRequestException('Only confirmed orders can be started');
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: 'IN_PROGRESS' },
    });
  }

  async submitDeliverables(
    id: string,
    advisorUserId: string,
    deliverables: string[],
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { service: { include: { advisor: true } } },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify advisor ownership
    if (order.service.advisor.userId !== advisorUserId) {
      throw new ForbiddenException('You can only submit deliverables for your own orders');
    }

    if (order.status !== 'IN_PROGRESS' && order.status !== 'REVISION_REQUESTED') {
      throw new BadRequestException(
        'Can only submit deliverables for in-progress or revision-requested orders',
      );
    }

    return this.prisma.order.update({
      where: { id },
      data: {
        deliverables,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: {
        service: true,
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async requestRevision(
    id: string,
    clientId: string,
    requestRevisionDto: RequestRevisionDto,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { service: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify client ownership
    if (order.clientId !== clientId) {
      throw new ForbiddenException('You can only request revisions for your own orders');
    }

    if (order.status !== 'IN_PROGRESS' && order.status !== 'COMPLETED') {
      throw new BadRequestException(
        'Can only request revisions for in-progress or completed orders',
      );
    }

    // Check if revisions are available
    const maxRevisions = order.service.revisions || 0;
    if (order.revisionCount >= maxRevisions) {
      throw new BadRequestException(
        `Maximum number of revisions (${maxRevisions}) has been reached`,
      );
    }

    return this.prisma.order.update({
      where: { id },
      data: {
        status: 'REVISION_REQUESTED',
        revisionCount: { increment: 1 },
        notes: requestRevisionDto.reason,
      },
    });
  }

  async completeOrder(id: string, clientId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { service: { include: { advisor: true } } },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify client ownership
    if (order.clientId !== clientId) {
      throw new ForbiddenException('You can only complete your own orders');
    }

    if (order.status !== 'COMPLETED') {
      throw new BadRequestException('Order must be in completed status');
    }

    // Update service stats
    await this.prisma.service.update({
      where: { id: order.serviceId },
      data: {
        totalOrders: { increment: 1 },
        totalRevenue: { increment: order.price },
        lastOrderAt: new Date(),
      },
    });

    // Update advisor stats
    await this.prisma.advisor.update({
      where: { id: order.service.advisor.id },
      data: {
        totalEarnings: { increment: order.price },
      },
    });

    return this.prisma.order.update({
      where: { id },
      data: { paymentStatus: 'SUCCEEDED' },
    });
  }

  async cancelOrder(
    id: string,
    userId: string,
    userRole: string,
    cancelOrderDto: CancelOrderDto,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { service: { include: { advisor: true } } },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify access
    const isClient = order.clientId === userId;
    const isAdvisor = order.service.advisor.userId === userId;

    if (!isClient && !isAdvisor) {
      throw new ForbiddenException('You can only cancel your own orders');
    }

    // Cannot cancel completed orders
    if (order.status === 'COMPLETED') {
      throw new BadRequestException('Cannot cancel completed orders');
    }

    return this.prisma.order.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationBy: userId,
        cancellationReason: cancelOrderDto.reason,
      },
    });
  }
}
