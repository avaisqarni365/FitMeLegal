import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from './admin.service';
import { SuspendUserDto } from './dto/suspend-user.dto';
import { VerifyAdvisorDto } from './dto/verify-advisor.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // User Management

  @Get('users')
  @ApiOperation({ summary: 'Get all users (admin only)' })
  getAllUsers(
    @Request() req,
    @Query('role') role?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAllUsers(req.user.userId, {
      role,
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user details (admin only)' })
  getUserDetails(@Request() req, @Param('id') id: string) {
    return this.adminService.getUserDetails(req.user.userId, id);
  }

  @Post('users/:id/suspend')
  @ApiOperation({ summary: 'Suspend a user (admin only)' })
  suspendUser(
    @Request() req,
    @Param('id') id: string,
    @Body() suspendUserDto: SuspendUserDto,
  ) {
    return this.adminService.suspendUser(req.user.userId, id, suspendUserDto);
  }

  @Post('users/:id/unsuspend')
  @ApiOperation({ summary: 'Unsuspend a user (admin only)' })
  unsuspendUser(@Request() req, @Param('id') id: string) {
    return this.adminService.unsuspendUser(req.user.userId, id);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete a user permanently (admin only)' })
  deleteUser(@Request() req, @Param('id') id: string) {
    return this.adminService.deleteUser(req.user.userId, id);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Update user role (admin only)' })
  updateUserRole(
    @Request() req,
    @Param('id') id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(req.user.userId, id, updateUserRoleDto);
  }

  // Advisor Management

  @Get('advisors/pending')
  @ApiOperation({ summary: 'Get pending advisors (admin only)' })
  getPendingAdvisors(@Request() req) {
    return this.adminService.getPendingAdvisors(req.user.userId);
  }

  @Post('advisors/:id/verify')
  @ApiOperation({ summary: 'Verify/approve/reject advisor (admin only)' })
  verifyAdvisor(
    @Request() req,
    @Param('id') id: string,
    @Body() verifyAdvisorDto: VerifyAdvisorDto,
  ) {
    return this.adminService.verifyAdvisor(req.user.userId, id, verifyAdvisorDto);
  }

  // Audit Logs

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get audit logs (admin only)' })
  getAuditLogs(
    @Request() req,
    @Query('action') action?: string,
    @Query('adminId') adminId?: string,
    @Query('entityType') entityType?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAuditLogs(req.user.userId, {
      action,
      adminId,
      entityType,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  // Platform Stats

  @Get('stats')
  @ApiOperation({ summary: 'Get platform statistics (admin only)' })
  getPlatformStats(@Request() req) {
    return this.adminService.getPlatformStats(req.user.userId);
  }
}
