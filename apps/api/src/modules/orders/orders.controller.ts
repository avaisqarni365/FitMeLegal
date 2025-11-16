import {
  Controller,
  Get,
  Post,
  Patch,
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
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderFilterDto } from './dto/order-filter.dto';
import { RequestRevisionDto } from './dto/request-revision.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@fitmelegal/shared';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('service/:serviceId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Create an order for a service (Client only)' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Service not available' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async create(
    @Param('serviceId') serviceId: string,
    @CurrentUser() user: any,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.ordersService.create(serviceId, user.id, createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all my orders (Client or Advisor)' })
  @ApiResponse({ status: 200, description: 'List of orders' })
  async findAll(@CurrentUser() user: any, @Query() filterDto: OrderFilterDto) {
    return this.ordersService.findAll(user.id, user.role, filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.findOne(id, user.id, user.role);
  }

  @Post(':id/confirm')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADVISOR)
  @ApiOperation({ summary: 'Confirm an order (Advisor only)' })
  @ApiResponse({ status: 200, description: 'Order confirmed' })
  @ApiResponse({ status: 400, description: 'Cannot confirm this order' })
  @ApiResponse({ status: 403, description: 'Not your order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async confirmOrder(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.confirmOrder(id, user.id);
  }

  @Post(':id/start')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADVISOR)
  @ApiOperation({ summary: 'Start working on an order (Advisor only)' })
  @ApiResponse({ status: 200, description: 'Order started' })
  @ApiResponse({ status: 400, description: 'Cannot start this order' })
  @ApiResponse({ status: 403, description: 'Not your order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async startOrder(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.startOrder(id, user.id);
  }

  @Post(':id/submit-deliverables')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADVISOR)
  @ApiOperation({ summary: 'Submit deliverables and complete order (Advisor only)' })
  @ApiResponse({ status: 200, description: 'Deliverables submitted' })
  @ApiResponse({ status: 400, description: 'Cannot submit deliverables' })
  @ApiResponse({ status: 403, description: 'Not your order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async submitDeliverables(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { deliverables: string[] },
  ) {
    return this.ordersService.submitDeliverables(id, user.id, body.deliverables);
  }

  @Post(':id/request-revision')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Request a revision (Client only)' })
  @ApiResponse({ status: 200, description: 'Revision requested' })
  @ApiResponse({
    status: 400,
    description: 'Cannot request revision or max revisions reached',
  })
  @ApiResponse({ status: 403, description: 'Not your order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async requestRevision(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() requestRevisionDto: RequestRevisionDto,
  ) {
    return this.ordersService.requestRevision(id, user.id, requestRevisionDto);
  }

  @Post(':id/complete')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Accept deliverables and complete order (Client only)' })
  @ApiResponse({ status: 200, description: 'Order completed' })
  @ApiResponse({ status: 400, description: 'Order not ready to complete' })
  @ApiResponse({ status: 403, description: 'Not your order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async completeOrder(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.completeOrder(id, user.id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order (Client or Advisor)' })
  @ApiResponse({ status: 200, description: 'Order cancelled' })
  @ApiResponse({ status: 400, description: 'Cannot cancel this order' })
  @ApiResponse({ status: 403, description: 'Not your order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async cancelOrder(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() cancelOrderDto: CancelOrderDto,
  ) {
    return this.ordersService.cancelOrder(id, user.id, user.role, cancelOrderDto);
  }
}
