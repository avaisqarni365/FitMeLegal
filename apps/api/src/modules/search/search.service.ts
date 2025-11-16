import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface SearchFilters {
  category?: string;
  specialty?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  verified?: boolean;
  availability?: 'AVAILABLE' | 'BUSY';
}

export interface SearchOptions {
  query: string;
  type?: 'ALL' | 'ADVISOR' | 'SERVICE' | 'QUESTION' | 'TEMPLATE';
  filters?: SearchFilters;
  page?: number;
  limit?: number;
  sortBy?: 'RELEVANCE' | 'RATING' | 'PRICE_LOW' | 'PRICE_HIGH' | 'RECENT';
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Main search function
   */
  async search(userId: string | null, options: SearchOptions) {
    const {
      query,
      type = 'ALL',
      filters = {},
      page = 1,
      limit = 20,
      sortBy = 'RELEVANCE',
    } = options;

    const skip = (page - 1) * limit;

    // Track search if user is logged in
    if (userId && query) {
      await this.trackSearch(userId, query, type as any, filters);
    }

    // Update popular searches
    if (query) {
      await this.updatePopularSearch(query, type as any);
    }

    // Perform search based on type
    let results: any = {};

    if (type === 'ALL') {
      results = await this.searchAll(query, filters, skip, limit, sortBy);
    } else if (type === 'ADVISOR') {
      results.advisors = await this.searchAdvisors(query, filters, skip, limit, sortBy);
    } else if (type === 'SERVICE') {
      results.services = await this.searchServices(query, filters, skip, limit, sortBy);
    } else if (type === 'QUESTION') {
      results.questions = await this.searchQuestions(query, filters, skip, limit, sortBy);
    } else if (type === 'TEMPLATE') {
      results.templates = await this.searchTemplates(query, filters, skip, limit, sortBy);
    }

    // Get facets (counts per category)
    const facets = await this.getFacets(query, filters);

    return {
      query,
      type,
      results,
      facets,
      pagination: {
        page,
        limit,
      },
    };
  }

  /**
   * Search all entities
   */
  private async searchAll(
    query: string,
    filters: SearchFilters,
    skip: number,
    limit: number,
    sortBy: string,
  ) {
    const [advisors, services, questions, templates] = await Promise.all([
      this.searchAdvisors(query, filters, 0, 5, sortBy),
      this.searchServices(query, filters, 0, 5, sortBy),
      this.searchQuestions(query, filters, 0, 5, sortBy),
      this.searchTemplates(query, filters, 0, 5, sortBy),
    ]);

    return {
      advisors,
      services,
      questions,
      templates,
    };
  }

  /**
   * Search advisors
   */
  private async searchAdvisors(
    query: string,
    filters: SearchFilters,
    skip: number,
    limit: number,
    sortBy: string,
  ) {
    const where: any = {};

    // Full-text search
    if (query) {
      where.OR = [
        { user: { firstName: { contains: query, mode: 'insensitive' } } },
        { user: { lastName: { contains: query, mode: 'insensitive' } } },
        { bio: { contains: query, mode: 'insensitive' } },
        { specialization: { hasSome: [query] } },
        { location: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Filters
    if (filters.specialty) {
      where.specialization = { has: filters.specialty };
    }
    if (filters.location) {
      where.location = { contains: filters.location, mode: 'insensitive' };
    }
    if (filters.minRating) {
      where.averageRating = { gte: filters.minRating };
    }
    if (filters.verified !== undefined) {
      where.verified = filters.verified;
    }
    if (filters.availability) {
      where.availability = filters.availability;
    }

    // Only show approved advisors
    where.status = 'APPROVED';

    // Sorting
    const orderBy: any = this.getOrderBy(sortBy, 'ADVISOR');

    const [advisors, total] = await Promise.all([
      this.prisma.advisor.findMany({
        where,
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
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.advisor.count({ where }),
    ]);

    return {
      items: advisors,
      total,
    };
  }

  /**
   * Search services
   */
  private async searchServices(
    query: string,
    filters: SearchFilters,
    skip: number,
    limit: number,
    sortBy: string,
  ) {
    const where: any = { status: 'ACTIVE' };

    // Full-text search
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } },
        { tags: { hasSome: [query] } },
      ];
    }

    // Filters
    if (filters.category) {
      where.category = filters.category;
    }
    if (filters.minPrice) {
      where.price = { ...(where.price || {}), gte: filters.minPrice };
    }
    if (filters.maxPrice) {
      where.price = { ...(where.price || {}), lte: filters.maxPrice };
    }
    if (filters.minRating) {
      where.averageRating = { gte: filters.minRating };
    }

    // Sorting
    const orderBy: any = this.getOrderBy(sortBy, 'SERVICE');

    const [services, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
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
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.service.count({ where }),
    ]);

    return {
      items: services,
      total,
    };
  }

  /**
   * Search questions
   */
  private async searchQuestions(
    query: string,
    filters: SearchFilters,
    skip: number,
    limit: number,
    sortBy: string,
  ) {
    const where: any = { status: 'OPEN' };

    // Full-text search
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } },
        { tags: { hasSome: [query] } },
      ];
    }

    // Filters
    if (filters.category) {
      where.category = filters.category;
    }

    // Sorting
    const orderBy: any = this.getOrderBy(sortBy, 'QUESTION');

    const [questions, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              answers: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.question.count({ where }),
    ]);

    return {
      items: questions,
      total,
    };
  }

  /**
   * Search document templates
   */
  private async searchTemplates(
    query: string,
    filters: SearchFilters,
    skip: number,
    limit: number,
    sortBy: string,
  ) {
    const where: any = { isActive: true };

    // Full-text search
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } },
        { tags: { hasSome: [query] } },
      ];
    }

    // Filters
    if (filters.category) {
      where.category = filters.category;
    }

    // Sorting
    const orderBy: any = this.getOrderBy(sortBy, 'TEMPLATE');

    const [templates, total] = await Promise.all([
      this.prisma.documentTemplate.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.documentTemplate.count({ where }),
    ]);

    return {
      items: templates,
      total,
    };
  }

  /**
   * Get facets (counts per category)
   */
  private async getFacets(query: string, filters: SearchFilters) {
    // For performance, we'll count only the main categories
    // In production, this could be cached

    const where = this.buildBaseWhere(query, filters);

    const [advisorCount, serviceCount, questionCount, templateCount] = await Promise.all([
      this.prisma.advisor.count({
        where: { ...where.advisor, status: 'APPROVED' },
      }),
      this.prisma.service.count({
        where: { ...where.service, status: 'ACTIVE' },
      }),
      this.prisma.question.count({
        where: { ...where.question, status: 'OPEN' },
      }),
      this.prisma.documentTemplate.count({
        where: { ...where.template, isActive: true },
      }),
    ]);

    return {
      advisors: advisorCount,
      services: serviceCount,
      questions: questionCount,
      templates: templateCount,
      total: advisorCount + serviceCount + questionCount + templateCount,
    };
  }

  /**
   * Build base where clause for facets
   */
  private buildBaseWhere(query: string, filters: SearchFilters) {
    const advisorWhere: any = {};
    const serviceWhere: any = {};
    const questionWhere: any = {};
    const templateWhere: any = {};

    if (query) {
      advisorWhere.OR = [
        { user: { firstName: { contains: query, mode: 'insensitive' } } },
        { user: { lastName: { contains: query, mode: 'insensitive' } } },
        { bio: { contains: query, mode: 'insensitive' } },
      ];

      serviceWhere.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];

      questionWhere.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];

      templateWhere.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    return {
      advisor: advisorWhere,
      service: serviceWhere,
      question: questionWhere,
      template: templateWhere,
    };
  }

  /**
   * Get search suggestions/autocomplete
   */
  async getSuggestions(query: string, limit = 10) {
    if (!query || query.length < 2) {
      return [];
    }

    // Get from popular searches
    const popularSearches = await this.prisma.popularSearch.findMany({
      where: {
        query: {
          contains: query,
          mode: 'insensitive',
        },
      },
      orderBy: {
        searchCount: 'desc',
      },
      take: limit,
      select: {
        query: true,
        searchType: true,
        searchCount: true,
      },
    });

    return popularSearches;
  }

  /**
   * Get user search history
   */
  async getSearchHistory(userId: string, limit = 20) {
    return this.prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get popular searches
   */
  async getPopularSearches(limit = 10) {
    return this.prisma.popularSearch.findMany({
      orderBy: { searchCount: 'desc' },
      take: limit,
      select: {
        query: true,
        searchType: true,
        searchCount: true,
      },
    });
  }

  /**
   * Track search in history
   */
  private async trackSearch(
    userId: string,
    query: string,
    searchType: any,
    filters: SearchFilters,
  ) {
    try {
      await this.prisma.searchHistory.create({
        data: {
          userId,
          query,
          searchType,
          filters: filters || {},
        },
      });
    } catch (error) {
      this.logger.error(`Failed to track search: ${error.message}`);
    }
  }

  /**
   * Update popular search counts
   */
  private async updatePopularSearch(query: string, searchType: any) {
    try {
      await this.prisma.popularSearch.upsert({
        where: { query },
        create: {
          query,
          searchType,
          searchCount: 1,
          lastSearched: new Date(),
        },
        update: {
          searchCount: {
            increment: 1,
          },
          lastSearched: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to update popular search: ${error.message}`);
    }
  }

  /**
   * Track search result click
   */
  async trackClick(userId: string, searchHistoryId: string, clickedId: string, clickedType: string) {
    try {
      await this.prisma.searchHistory.update({
        where: { id: searchHistoryId },
        data: {
          clicked: true,
          clickedId,
          clickedType,
        },
      });

      // Update popular search click count
      const history = await this.prisma.searchHistory.findUnique({
        where: { id: searchHistoryId },
      });

      if (history) {
        await this.prisma.popularSearch.update({
          where: { query: history.query },
          data: {
            clickCount: {
              increment: 1,
            },
          },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to track click: ${error.message}`);
    }
  }

  /**
   * Clear user search history
   */
  async clearSearchHistory(userId: string) {
    return this.prisma.searchHistory.deleteMany({
      where: { userId },
    });
  }

  /**
   * Get order by clause based on sort option
   */
  private getOrderBy(sortBy: string, entityType: string): any {
    switch (sortBy) {
      case 'RATING':
        return { averageRating: 'desc' };
      case 'PRICE_LOW':
        return entityType === 'SERVICE' ? { price: 'asc' } : { createdAt: 'desc' };
      case 'PRICE_HIGH':
        return entityType === 'SERVICE' ? { price: 'desc' } : { createdAt: 'desc' };
      case 'RECENT':
        return { createdAt: 'desc' };
      case 'RELEVANCE':
      default:
        // For relevance, we could implement a scoring system
        // For now, default to recent + rating combination
        return [{ averageRating: 'desc' }, { createdAt: 'desc' }];
    }
  }
}
