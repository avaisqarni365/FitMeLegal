import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchService, SearchOptions } from './search.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Search across the platform' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'type', required: false, enum: ['ALL', 'ADVISOR', 'SERVICE', 'QUESTION', 'TEMPLATE'] })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'specialty', required: false })
  @ApiQuery({ name: 'location', required: false })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({ name: 'verified', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['RELEVANCE', 'RATING', 'PRICE_LOW', 'PRICE_HIGH', 'RECENT'] })
  async search(@Request() req, @Query() query: any) {
    const userId = req.user?.userId || null;

    const options: SearchOptions = {
      query: query.q || '',
      type: query.type || 'ALL',
      filters: {
        category: query.category,
        specialty: query.specialty,
        location: query.location,
        minPrice: query.minPrice ? parseFloat(query.minPrice) : undefined,
        maxPrice: query.maxPrice ? parseFloat(query.maxPrice) : undefined,
        minRating: query.minRating ? parseFloat(query.minRating) : undefined,
        verified: query.verified === 'true' ? true : query.verified === 'false' ? false : undefined,
      },
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20,
      sortBy: query.sortBy || 'RELEVANCE',
    };

    return this.searchService.search(userId, options);
  }

  @Get('suggestions')
  @Public()
  @ApiOperation({ summary: 'Get search suggestions/autocomplete' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getSuggestions(@Query('q') query: string, @Query('limit') limit?: string) {
    return this.searchService.getSuggestions(query, limit ? parseInt(limit) : 10);
  }

  @Get('popular')
  @Public()
  @ApiOperation({ summary: 'Get popular searches' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getPopularSearches(@Query('limit') limit?: string) {
    return this.searchService.getPopularSearches(limit ? parseInt(limit) : 10);
  }

  @Get('history')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my search history' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getSearchHistory(@Request() req, @Query('limit') limit?: string) {
    return this.searchService.getSearchHistory(req.user.userId, limit ? parseInt(limit) : 20);
  }

  @Post('track-click')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Track search result click' })
  trackClick(
    @Request() req,
    @Body() body: { searchHistoryId: string; clickedId: string; clickedType: string },
  ) {
    return this.searchService.trackClick(
      req.user.userId,
      body.searchHistoryId,
      body.clickedId,
      body.clickedType,
    );
  }

  @Delete('history')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Clear search history' })
  clearSearchHistory(@Request() req) {
    return this.searchService.clearSearchHistory(req.user.userId);
  }
}
