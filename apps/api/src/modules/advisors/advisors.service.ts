import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAdvisorDto } from './dto/create-advisor.dto';
import { UpdateAdvisorDto } from './dto/update-advisor.dto';
import { AdvisorFilterDto } from './dto/advisor-filter.dto';
import { UserRole } from '@fitmelegal/shared';

@Injectable()
export class AdvisorsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createAdvisorDto: CreateAdvisorDto) {
    // Check if user exists and has ADVISOR role
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.ADVISOR) {
      throw new ForbiddenException('Only users with ADVISOR role can create advisor profiles');
    }

    // Check if advisor profile already exists
    const existingAdvisor = await this.prisma.advisor.findUnique({
      where: { userId },
    });

    if (existingAdvisor) {
      throw new ConflictException('Advisor profile already exists for this user');
    }

    // Create advisor profile
    return this.prisma.advisor.create({
      data: {
        userId,
        advisorType: createAdvisorDto.advisorType,
        specializations: createAdvisorDto.specializations,
        languages: createAdvisorDto.languages,
        licenseNumber: createAdvisorDto.licenseNumber,
        barAssociation: createAdvisorDto.barAssociation,
        yearsExperience: createAdvisorDto.yearsExperience,
        bio: createAdvisorDto.bio,
        hourlyRate: createAdvisorDto.hourlyRate,
      },
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
    });
  }

  async findAll(filterDto: AdvisorFilterDto) {
    const { page, limit, sortBy, sortOrder, ...filters } = filterDto;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      active: true,
      verificationStatus: 'VERIFIED',
    };

    if (filters.advisorType) {
      where.advisorType = filters.advisorType;
    }

    if (filters.specialization) {
      where.specializations = {
        array_contains: [filters.specialization],
      };
    }

    if (filters.language) {
      where.languages = {
        array_contains: [filters.language],
      };
    }

    if (filters.minRating) {
      where.rating = {
        gte: filters.minRating,
      };
    }

    if (filters.maxHourlyRate) {
      where.hourlyRate = {
        lte: filters.maxHourlyRate,
      };
    }

    // Execute query
    const [advisors, total] = await Promise.all([
      this.prisma.advisor.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
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
      }),
      this.prisma.advisor.count({ where }),
    ]);

    return {
      data: advisors,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const advisor = await this.prisma.advisor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            language: true,
          },
        },
        reviews: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            reviewer: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!advisor) {
      throw new NotFoundException('Advisor not found');
    }

    return advisor;
  }

  async findByUserId(userId: string) {
    const advisor = await this.prisma.advisor.findUnique({
      where: { userId },
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
    });

    if (!advisor) {
      throw new NotFoundException('Advisor profile not found');
    }

    return advisor;
  }

  async update(userId: string, updateAdvisorDto: UpdateAdvisorDto) {
    const advisor = await this.prisma.advisor.findUnique({
      where: { userId },
    });

    if (!advisor) {
      throw new NotFoundException('Advisor profile not found');
    }

    return this.prisma.advisor.update({
      where: { userId },
      data: updateAdvisorDto,
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
    });
  }

  async updateVerificationStatus(
    id: string,
    status: 'PENDING' | 'VERIFIED' | 'REJECTED',
    notes?: string,
  ) {
    return this.prisma.advisor.update({
      where: { id },
      data: {
        verificationStatus: status,
      },
    });
  }
}
