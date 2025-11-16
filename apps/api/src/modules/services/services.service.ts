import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceFilterDto } from './dto/service-filter.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async create(advisorUserId: string, createServiceDto: CreateServiceDto) {
    // Get advisor profile
    const advisor = await this.prisma.advisor.findUnique({
      where: { userId: advisorUserId },
    });

    if (!advisor) {
      throw new NotFoundException('Advisor profile not found');
    }

    if (!advisor.active || advisor.verificationStatus !== 'VERIFIED') {
      throw new ForbiddenException(
        'Only verified and active advisors can create services',
      );
    }

    // Create service
    return this.prisma.service.create({
      data: {
        advisorId: advisor.id,
        category: createServiceDto.category,
        subcategory: createServiceDto.subcategory,
        title: createServiceDto.title,
        description: createServiceDto.description,
        price: createServiceDto.price,
        currency: createServiceDto.currency || 'EUR',
        deliveryTime: createServiceDto.deliveryTime,
        revisions: createServiceDto.revisions || 0,
        requirements: createServiceDto.requirements,
        deliverables: createServiceDto.deliverables,
        languages: createServiceDto.languages,
        tags: createServiceDto.tags || [],
      },
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
    });
  }

  async findAll(filterDto: ServiceFilterDto) {
    const { page, limit, sortBy, sortOrder, search, ...filters } = filterDto;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      active: true,
      advisor: {
        active: true,
        verificationStatus: 'VERIFIED',
      },
    };

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.subcategory) {
      where.subcategory = filters.subcategory;
    }

    if (filters.advisorId) {
      where.advisorId = filters.advisorId;
    }

    if (filters.language) {
      where.languages = {
        array_contains: [filters.language],
      };
    }

    if (filters.minRating) {
      where.averageRating = {
        gte: filters.minRating,
      };
    }

    if (filters.maxPrice) {
      where.price = {
        lte: filters.maxPrice,
      };
    }

    if (filters.maxDeliveryTime) {
      where.deliveryTime = {
        lte: filters.maxDeliveryTime,
      };
    }

    if (filters.featured !== undefined) {
      where.featured = filters.featured;
    }

    // Search in title and description
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Execute query
    const [services, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
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
      }),
      this.prisma.service.count({ where }),
    ]);

    return {
      data: services,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        advisor: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Increment view count
    await this.prisma.service.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return service;
  }

  async findMyServices(advisorUserId: string, filterDto?: ServiceFilterDto) {
    // Get advisor profile
    const advisor = await this.prisma.advisor.findUnique({
      where: { userId: advisorUserId },
    });

    if (!advisor) {
      throw new NotFoundException('Advisor profile not found');
    }

    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = filterDto || {};
    const skip = (page - 1) * limit;

    const [services, total] = await Promise.all([
      this.prisma.service.findMany({
        where: { advisorId: advisor.id },
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      this.prisma.service.count({ where: { advisorId: advisor.id } }),
    ]);

    return {
      data: services,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(
    id: string,
    advisorUserId: string,
    updateServiceDto: UpdateServiceDto,
  ) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: { advisor: true },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Verify ownership
    if (service.advisor.userId !== advisorUserId) {
      throw new ForbiddenException('You can only update your own services');
    }

    return this.prisma.service.update({
      where: { id },
      data: updateServiceDto,
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
    });
  }

  async remove(id: string, advisorUserId: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: { advisor: true },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Verify ownership
    if (service.advisor.userId !== advisorUserId) {
      throw new ForbiddenException('You can only delete your own services');
    }

    // Check if service has active orders
    const activeOrders = await this.prisma.order.count({
      where: {
        serviceId: id,
        status: {
          in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'REVISION_REQUESTED'],
        },
      },
    });

    if (activeOrders > 0) {
      throw new BadRequestException(
        'Cannot delete service with active orders. Please complete or cancel them first.',
      );
    }

    return this.prisma.service.delete({
      where: { id },
    });
  }
}
