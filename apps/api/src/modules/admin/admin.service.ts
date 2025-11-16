import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SuspendUserDto } from './dto/suspend-user.dto';
import { VerifyAdvisorDto, VerificationAction } from './dto/verify-advisor.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  /**
   * Verify user is admin
   */
  private async verifyAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    return user;
  }

  /**
   * Log admin action
   */
  private async logAction(
    adminId: string,
    action: string,
    entityType?: string,
    entityId?: string,
    details?: any,
  ) {
    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: action as any,
        entityType,
        entityId,
        details: details || {},
      },
    });
  }

  /**
   * Get all users with filters
   */
  async getAllUsers(
    adminId: string,
    filters?: {
      role?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    await this.verifyAdmin(adminId);

    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          emailVerified: true,
          kycStatus: true,
          createdAt: true,
          deletedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user details
   */
  async getUserDetails(adminId: string, userId: string) {
    await this.verifyAdmin(adminId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        advisor: true,
        questions: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        orders: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        subscriptions: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Suspend a user
   */
  async suspendUser(adminId: string, userId: string, suspendUserDto: SuspendUserDto) {
    await this.verifyAdmin(adminId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'ADMIN') {
      throw new BadRequestException('Cannot suspend admin users');
    }

    // Set deletedAt to mark as suspended (soft delete)
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
      },
    });

    await this.logAction(adminId, 'SUSPEND_USER', 'User', userId, {
      reason: suspendUserDto.reason,
      details: suspendUserDto.details,
    });

    return { success: true, message: 'User suspended successfully', user: updated };
  }

  /**
   * Unsuspend a user
   */
  async unsuspendUser(adminId: string, userId: string) {
    await this.verifyAdmin(adminId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: null,
      },
    });

    await this.logAction(adminId, 'UNSUSPEND_USER', 'User', userId);

    return { success: true, message: 'User unsuspended successfully', user: updated };
  }

  /**
   * Delete a user permanently
   */
  async deleteUser(adminId: string, userId: string) {
    await this.verifyAdmin(adminId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'ADMIN') {
      throw new BadRequestException('Cannot delete admin users');
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });

    await this.logAction(adminId, 'DELETE_USER', 'User', userId);

    return { success: true, message: 'User deleted permanently' };
  }

  /**
   * Update user role
   */
  async updateUserRole(
    adminId: string,
    userId: string,
    updateUserRoleDto: UpdateUserRoleDto,
  ) {
    await this.verifyAdmin(adminId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: updateUserRoleDto.role,
      },
    });

    await this.logAction(adminId, 'UPDATE_USER_ROLE', 'User', userId, {
      oldRole: user.role,
      newRole: updateUserRoleDto.role,
      reason: updateUserRoleDto.reason,
    });

    return { success: true, message: 'User role updated successfully', user: updated };
  }

  /**
   * Get all advisors pending verification
   */
  async getPendingAdvisors(adminId: string) {
    await this.verifyAdmin(adminId);

    const advisors = await this.prisma.advisor.findMany({
      where: {
        verificationStatus: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return advisors;
  }

  /**
   * Verify/Approve/Reject advisor
   */
  async verifyAdvisor(
    adminId: string,
    advisorId: string,
    verifyAdvisorDto: VerifyAdvisorDto,
  ) {
    await this.verifyAdmin(adminId);

    const advisor = await this.prisma.advisor.findUnique({
      where: { id: advisorId },
      include: { user: true },
    });

    if (!advisor) {
      throw new NotFoundException('Advisor not found');
    }

    let updated;

    switch (verifyAdvisorDto.action) {
      case VerificationAction.APPROVE:
        updated = await this.prisma.advisor.update({
          where: { id: advisorId },
          data: {
            verificationStatus: 'VERIFIED',
            verificationLevel: 'PROFESSIONAL',
          },
        });
        await this.logAction(adminId, 'APPROVE_ADVISOR', 'Advisor', advisorId, {
          notes: verifyAdvisorDto.notes,
        });
        break;

      case VerificationAction.REJECT:
        updated = await this.prisma.advisor.update({
          where: { id: advisorId },
          data: {
            verificationStatus: 'REJECTED',
          },
        });
        await this.logAction(adminId, 'REJECT_ADVISOR', 'Advisor', advisorId, {
          notes: verifyAdvisorDto.notes,
        });
        break;

      case VerificationAction.VERIFY:
        updated = await this.prisma.advisor.update({
          where: { id: advisorId },
          data: {
            verificationStatus: 'VERIFIED',
            verificationLevel: verifyAdvisorDto.verificationLevel || 'ENHANCED',
          },
        });
        await this.logAction(adminId, 'VERIFY_ADVISOR', 'Advisor', advisorId, {
          verificationLevel: verifyAdvisorDto.verificationLevel,
          notes: verifyAdvisorDto.notes,
        });
        break;
    }

    return {
      success: true,
      message: `Advisor ${verifyAdvisorDto.action.toLowerCase()}d successfully`,
      advisor: updated,
    };
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(
    adminId: string,
    filters?: {
      action?: string;
      adminId?: string;
      entityType?: string;
      page?: number;
      limit?: number;
    },
  ) {
    await this.verifyAdmin(adminId);

    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.action) {
      where.action = filters.action;
    }

    if (filters?.adminId) {
      where.adminId = filters.adminId;
    }

    if (filters?.entityType) {
      where.entityType = filters.entityType;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get platform statistics
   */
  async getPlatformStats(adminId: string) {
    await this.verifyAdmin(adminId);

    const [
      totalUsers,
      totalAdvisors,
      totalQuestions,
      totalOrders,
      totalServices,
      pendingAdvisors,
      activeSubscriptions,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.advisor.count(),
      this.prisma.question.count(),
      this.prisma.order.count(),
      this.prisma.service.count(),
      this.prisma.advisor.count({ where: { verificationStatus: 'PENDING' } }),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    ]);

    // Revenue calculation (sum of completed orders)
    const revenueData = await this.prisma.order.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { price: true },
    });

    return {
      users: {
        total: totalUsers,
        advisors: totalAdvisors,
        clients: totalUsers - totalAdvisors,
      },
      content: {
        questions: totalQuestions,
        services: totalServices,
        orders: totalOrders,
      },
      advisors: {
        total: totalAdvisors,
        pending: pendingAdvisors,
        verified: totalAdvisors - pendingAdvisors,
      },
      subscriptions: {
        active: activeSubscriptions,
      },
      revenue: {
        total: revenueData._sum.price || 0,
        currency: 'EUR',
      },
    };
  }
}
