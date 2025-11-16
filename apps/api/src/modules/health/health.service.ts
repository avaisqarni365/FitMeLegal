import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoggerService } from '../../common/logger/logger.service';

@Injectable()
export class HealthService {
  private startTime: Date;

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {
    this.startTime = new Date();
    this.logger.setContext('HealthService');
  }

  /**
   * Basic health check
   */
  async getHealth() {
    const status = 'ok';
    const timestamp = new Date().toISOString();
    const uptime = this.getUptime();

    return {
      status,
      timestamp,
      uptime,
      service: 'FitMeLegal API',
      version: process.env.npm_package_version || '1.0.0',
    };
  }

  /**
   * Readiness check - checks if service is ready to accept traffic
   */
  async getReadiness() {
    const checks = {
      database: await this.checkDatabase(),
    };

    const isReady = Object.values(checks).every((check) => check.status === 'up');

    return {
      status: isReady ? 'ready' : 'not_ready',
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Liveness check - checks if service is alive
   */
  async getLiveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
    };
  }

  /**
   * Get system metrics
   */
  async getMetrics() {
    const memoryUsage = process.memoryUsage();

    return {
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
      },
      process: {
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    };
  }

  /**
   * Check database connectivity
   */
  private async checkDatabase() {
    try {
      const startTime = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const duration = Date.now() - startTime;

      return {
        status: 'up',
        responseTime: `${duration}ms`,
      };
    } catch (error) {
      this.logger.error('Database health check failed', error.message);
      return {
        status: 'down',
        error: error.message,
      };
    }
  }

  /**
   * Get service uptime
   */
  private getUptime() {
    const uptimeMs = Date.now() - this.startTime.getTime();
    const uptimeSeconds = Math.floor(uptimeMs / 1000);

    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;

    return {
      ms: uptimeMs,
      formatted: `${days}d ${hours}h ${minutes}m ${seconds}s`,
    };
  }
}
