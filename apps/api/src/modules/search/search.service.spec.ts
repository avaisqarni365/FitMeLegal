import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '../../prisma/prisma.service';
import { mockPrismaService, TestDataFactory } from '../../../test/test-utils';

describe('SearchService', () => {
  let service: SearchService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('search', () => {
    it('should perform a basic search', async () => {
      const mockAdvisors = [TestDataFactory.createAdvisor()];
      const mockServices = [TestDataFactory.createService()];

      prisma.advisor.findMany.mockResolvedValue(mockAdvisors);
      prisma.advisor.count.mockResolvedValue(1);
      prisma.service.findMany.mockResolvedValue(mockServices);
      prisma.service.count.mockResolvedValue(1);
      prisma.question.findMany.mockResolvedValue([]);
      prisma.question.count.mockResolvedValue(0);
      prisma.documentTemplate.findMany.mockResolvedValue([]);
      prisma.documentTemplate.count.mockResolvedValue(0);

      prisma.popularSearch.upsert.mockResolvedValue({});

      const result = await service.search('user-123', {
        query: 'lawyer',
        type: 'ALL',
      });

      expect(result.query).toBe('lawyer');
      expect(result.type).toBe('ALL');
      expect(result.results.advisors).toBeDefined();
      expect(result.results.services).toBeDefined();
      expect(result.facets).toBeDefined();
    });

    it('should search advisors only', async () => {
      const mockAdvisors = [
        TestDataFactory.createAdvisor(),
        TestDataFactory.createAdvisor(),
      ];

      prisma.advisor.findMany.mockResolvedValue(mockAdvisors);
      prisma.advisor.count.mockResolvedValue(2);
      prisma.popularSearch.upsert.mockResolvedValue({});

      const result = await service.search('user-123', {
        query: 'tax attorney',
        type: 'ADVISOR',
        page: 1,
        limit: 10,
      });

      expect(result.results.advisors).toBeDefined();
      expect(result.results.advisors.items).toHaveLength(2);
      expect(result.results.advisors.total).toBe(2);
      expect(prisma.advisor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'APPROVED',
          }),
          skip: 0,
          take: 10,
        }),
      );
    });

    it('should apply filters correctly', async () => {
      prisma.advisor.findMany.mockResolvedValue([]);
      prisma.advisor.count.mockResolvedValue(0);
      prisma.popularSearch.upsert.mockResolvedValue({});

      await service.search('user-123', {
        query: 'lawyer',
        type: 'ADVISOR',
        filters: {
          location: 'Berlin',
          minRating: 4.5,
          verified: true,
        },
      });

      expect(prisma.advisor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            location: expect.objectContaining({
              contains: 'Berlin',
              mode: 'insensitive',
            }),
            averageRating: { gte: 4.5 },
            verified: true,
            status: 'APPROVED',
          }),
        }),
      );
    });

    it('should track search in history when user is logged in', async () => {
      prisma.advisor.findMany.mockResolvedValue([]);
      prisma.advisor.count.mockResolvedValue(0);
      prisma.service.findMany.mockResolvedValue([]);
      prisma.service.count.mockResolvedValue(0);
      prisma.question.findMany.mockResolvedValue([]);
      prisma.question.count.mockResolvedValue(0);
      prisma.documentTemplate.findMany.mockResolvedValue([]);
      prisma.documentTemplate.count.mockResolvedValue(0);
      prisma.searchHistory.create.mockResolvedValue({});
      prisma.popularSearch.upsert.mockResolvedValue({});

      await service.search('user-123', {
        query: 'test search',
        type: 'ALL',
      });

      expect(prisma.searchHistory.create).toHaveBeenCalled();
    });

    it('should not track search when user is not logged in', async () => {
      prisma.advisor.findMany.mockResolvedValue([]);
      prisma.advisor.count.mockResolvedValue(0);
      prisma.service.findMany.mockResolvedValue([]);
      prisma.service.count.mockResolvedValue(0);
      prisma.question.findMany.mockResolvedValue([]);
      prisma.question.count.mockResolvedValue(0);
      prisma.documentTemplate.findMany.mockResolvedValue([]);
      prisma.documentTemplate.count.mockResolvedValue(0);
      prisma.popularSearch.upsert.mockResolvedValue({});

      await service.search(null, {
        query: 'test search',
        type: 'ALL',
      });

      expect(prisma.searchHistory.create).not.toHaveBeenCalled();
    });

    it('should update popular search counts', async () => {
      prisma.advisor.findMany.mockResolvedValue([]);
      prisma.advisor.count.mockResolvedValue(0);
      prisma.service.findMany.mockResolvedValue([]);
      prisma.service.count.mockResolvedValue(0);
      prisma.question.findMany.mockResolvedValue([]);
      prisma.question.count.mockResolvedValue(0);
      prisma.documentTemplate.findMany.mockResolvedValue([]);
      prisma.documentTemplate.count.mockResolvedValue(0);
      prisma.popularSearch.upsert.mockResolvedValue({});

      await service.search(null, {
        query: 'popular search',
        type: 'ADVISOR',
      });

      expect(prisma.popularSearch.upsert).toHaveBeenCalledWith({
        where: { query: 'popular search' },
        create: expect.objectContaining({
          query: 'popular search',
          searchType: 'ADVISOR',
        }),
        update: expect.objectContaining({
          searchCount: { increment: 1 },
        }),
      });
    });
  });

  describe('getSuggestions', () => {
    it('should return search suggestions', async () => {
      const mockSuggestions = [
        { query: 'tax attorney', searchType: 'ADVISOR', searchCount: 50 },
        { query: 'tax law', searchType: 'SERVICE', searchCount: 30 },
      ];

      prisma.popularSearch.findMany.mockResolvedValue(mockSuggestions);

      const result = await service.getSuggestions('tax', 10);

      expect(result).toEqual(mockSuggestions);
      expect(prisma.popularSearch.findMany).toHaveBeenCalledWith({
        where: {
          query: {
            contains: 'tax',
            mode: 'insensitive',
          },
        },
        orderBy: { searchCount: 'desc' },
        take: 10,
        select: {
          query: true,
          searchType: true,
          searchCount: true,
        },
      });
    });

    it('should return empty array for short query', async () => {
      const result = await service.getSuggestions('a', 10);

      expect(result).toEqual([]);
      expect(prisma.popularSearch.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getSearchHistory', () => {
    it('should return user search history', async () => {
      const userId = 'user-123';
      const mockHistory = [
        {
          id: 'hist-1',
          userId,
          query: 'lawyer',
          searchType: 'ADVISOR',
          filters: {},
          resultsCount: 5,
          createdAt: new Date(),
        },
      ];

      prisma.searchHistory.findMany.mockResolvedValue(mockHistory);

      const result = await service.getSearchHistory(userId, 20);

      expect(result).toEqual(mockHistory);
      expect(prisma.searchHistory.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
    });
  });

  describe('getPopularSearches', () => {
    it('should return popular searches', async () => {
      const mockPopular = [
        { query: 'tax lawyer', searchType: 'ADVISOR', searchCount: 100 },
        { query: 'business law', searchType: 'SERVICE', searchCount: 80 },
      ];

      prisma.popularSearch.findMany.mockResolvedValue(mockPopular);

      const result = await service.getPopularSearches(10);

      expect(result).toEqual(mockPopular);
      expect(prisma.popularSearch.findMany).toHaveBeenCalledWith({
        orderBy: { searchCount: 'desc' },
        take: 10,
        select: {
          query: true,
          searchType: true,
          searchCount: true,
        },
      });
    });
  });

  describe('trackClick', () => {
    it('should track search result click', async () => {
      const searchHistoryId = 'hist-123';
      const mockHistory = {
        id: searchHistoryId,
        query: 'lawyer',
        userId: 'user-123',
      };

      prisma.searchHistory.update.mockResolvedValue({});
      prisma.searchHistory.findUnique.mockResolvedValue(mockHistory);
      prisma.popularSearch.update.mockResolvedValue({});

      await service.trackClick('user-123', searchHistoryId, 'advisor-456', 'ADVISOR');

      expect(prisma.searchHistory.update).toHaveBeenCalledWith({
        where: { id: searchHistoryId },
        data: {
          clicked: true,
          clickedId: 'advisor-456',
          clickedType: 'ADVISOR',
        },
      });

      expect(prisma.popularSearch.update).toHaveBeenCalledWith({
        where: { query: 'lawyer' },
        data: {
          clickCount: { increment: 1 },
        },
      });
    });
  });

  describe('clearSearchHistory', () => {
    it('should clear user search history', async () => {
      const userId = 'user-123';
      prisma.searchHistory.deleteMany.mockResolvedValue({ count: 5 });

      const result = await service.clearSearchHistory(userId);

      expect(result.count).toBe(5);
      expect(prisma.searchHistory.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });
  });
});
