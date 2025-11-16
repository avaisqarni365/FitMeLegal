import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoggerService } from '../logger/logger.service';

export interface AuditLogData {
  adminId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('AuditService');
  }

  /**
   * Create an audit log entry
   */
  async logAction(data: AuditLogData) {
    try {
      const auditLog = await this.prisma.auditLog.create({
        data: {
          adminId: data.adminId,
          action: data.action as any,
          entityType: data.entityType,
          entityId: data.entityId,
          details: data.details || {},
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });

      this.logger.log(`Audit: ${data.action}`, {
        adminId: data.adminId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
      });

      return auditLog;
    } catch (error) {
      this.logger.error('Failed to create audit log', error.message, {
        action: data.action,
        adminId: data.adminId,
      });
      throw error;
    }
  }

  /**
   * Get audit logs with filtering
   */
  async getAuditLogs(filters: {
    adminId?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 50, ...where } = filters;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (where.adminId) whereClause.adminId = where.adminId;
    if (where.action) whereClause.action = where.action;
    if (where.entityType) whereClause.entityType = where.entityType;
    if (where.entityId) whereClause.entityId = where.entityId;

    if (where.startDate || where.endDate) {
      whereClause.createdAt = {};
      if (where.startDate) whereClause.createdAt.gte = where.startDate;
      if (where.endDate) whereClause.createdAt.lte = where.endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: whereClause,
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
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where: whereClause }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get audit log by ID
   */
  async getAuditLog(id: string) {
    return this.prisma.auditLog.findUnique({
      where: { id },
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
    });
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(startDate?: Date, endDate?: Date) {
    const whereClause: any = {};

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }

    const [
      totalActions,
      actionsByType,
      topAdmins,
    ] = await Promise.all([
      this.prisma.auditLog.count({ where: whereClause }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where: whereClause,
        _count: {
          action: true,
        },
        orderBy: {
          _count: {
            action: 'desc',
          },
        },
      }),
      this.prisma.auditLog.groupBy({
        by: ['adminId'],
        where: whereClause,
        _count: {
          adminId: true,
        },
        orderBy: {
          _count: {
            adminId: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    return {
      totalActions,
      actionsByType: actionsByType.map((item) => ({
        action: item.action,
        count: item._count.action,
      })),
      topAdmins: topAdmins.map((item) => ({
        adminId: item.adminId,
        count: item._count.adminId,
      })),
    };
  }
}
