import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceFilterDto } from './dto/service-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@fitmelegal/shared';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new service (Advisor only)' })
  @ApiResponse({ status: 201, description: 'Service created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not an advisor' })
  @ApiResponse({ status: 404, description: 'Advisor profile not found' })
  async create(
    @CurrentUser() user: any,
    @Body() createServiceDto: CreateServiceDto,
  ) {
    return this.servicesService.create(user.id, createServiceDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all active services with filters (Public)' })
  @ApiResponse({ status: 200, description: 'List of services' })
  async findAll(@Query() filterDto: ServiceFilterDto) {
    return this.servicesService.findAll(filterDto);
  }

  @Get('my-services')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current advisor services' })
  @ApiResponse({ status: 200, description: 'List of advisor services' })
  @ApiResponse({ status: 404, description: 'Advisor profile not found' })
  async getMyServices(
    @CurrentUser() user: any,
    @Query() filterDto: ServiceFilterDto,
  ) {
    return this.servicesService.findMyServices(user.id, filterDto);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get service by ID (Public)' })
  @ApiResponse({ status: 200, description: 'Service found' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update service (Owner only)' })
  @ApiResponse({ status: 200, description: 'Service updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the owner' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    return this.servicesService.update(id, user.id, updateServiceDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete service (Owner only)' })
  @ApiResponse({ status: 200, description: 'Service deleted successfully' })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete service with active orders',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the owner' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.servicesService.remove(id, user.id);
  }
}
