import { Prisma } from '@prisma/client';
import { LoggerService } from '../common/logger/logger.service';

/**
 * Prisma middleware for query performance monitoring
 */
export function createPerformanceMiddleware(logger: LoggerService): Prisma.Middleware {
  return async (params, next) => {
    const startTime = Date.now();

    try {
      const result = await next(params);
      const duration = Date.now() - startTime;

      // Log slow queries (> 100ms)
      if (duration > 100) {
        logger.warn(`Slow database query detected`, {
          model: params.model,
          action: params.action,
          duration,
        });
      }

      // Log very slow queries (> 1000ms)
      if (duration > 1000) {
        logger.error('Very slow database query', undefined, {
          model: params.model,
          action: params.action,
          duration,
          args: params.args,
        });
      }

      // Log all queries in debug mode
      logger.debug(`DB Query: ${params.model}.${params.action}`, {
        model: params.model,
        action: params.action,
        duration,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error('Database query failed', error.message, {
        model: params.model,
        action: params.action,
        duration,
        error: error.message,
      });

      throw error;
    }
  };
}

/**
 * Query optimization hints and best practices
 */
export class QueryOptimizer {
  /**
   * Optimize findMany queries with proper pagination
   */
  static paginateQuery(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    return {
      skip,
      take: Math.min(limit, 100), // Cap at 100 items per page
    };
  }

  /**
   * Create efficient include/select for relationships
   */
  static selectFields<T extends Record<string, any>>(fields: T) {
    return { select: fields };
  }

  /**
   * Common optimization patterns
   */
  static readonly patterns = {
    /**
     * For lists: Only select necessary fields
     */
    listView: {
      id: true,
      createdAt: true,
      updatedAt: true,
    },

    /**
     * For detail view: Full object
     */
    detailView: {},

    /**
     * For user references: Minimal user data
     */
    userReference: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatarUrl: true,
      },
    },
  };
}
