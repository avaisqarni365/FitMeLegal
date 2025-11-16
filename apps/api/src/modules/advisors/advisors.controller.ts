import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdvisorsService } from './advisors.service';
import { CreateAdvisorDto } from './dto/create-advisor.dto';
import { UpdateAdvisorDto } from './dto/update-advisor.dto';
import { AdvisorFilterDto } from './dto/advisor-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@fitmelegal/shared';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('advisors')
@Controller('advisors')
export class AdvisorsController {
  constructor(private readonly advisorsService: AdvisorsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create advisor profile (Advisor only)' })
  @ApiResponse({ status: 201, description: 'Advisor profile created' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not an advisor' })
  @ApiResponse({ status: 409, description: 'Advisor profile already exists' })
  async create(@CurrentUser() user: any, @Body() createAdvisorDto: CreateAdvisorDto) {
    return this.advisorsService.create(user.id, createAdvisorDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all verified advisors with filters' })
  @ApiResponse({ status: 200, description: 'List of advisors' })
  async findAll(@Query() filterDto: AdvisorFilterDto) {
    return this.advisorsService.findAll(filterDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current advisor profile' })
  @ApiResponse({ status: 200, description: 'Advisor profile' })
  @ApiResponse({ status: 404, description: 'Advisor profile not found' })
  async getMyProfile(@CurrentUser() user: any) {
    return this.advisorsService.findByUserId(user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current advisor profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 404, description: 'Advisor profile not found' })
  async updateMyProfile(@CurrentUser() user: any, @Body() updateAdvisorDto: UpdateAdvisorDto) {
    return this.advisorsService.update(user.id, updateAdvisorDto);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get advisor by ID (public)' })
  @ApiResponse({ status: 200, description: 'Advisor found' })
  @ApiResponse({ status: 404, description: 'Advisor not found' })
  async findOne(@Param('id') id: string) {
    return this.advisorsService.findOne(id);
  }
}
