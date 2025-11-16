import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@ApiTags('projects')
@Controller('projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new project',
    description: 'Create a document workspace project',
  })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  async create(
    @CurrentUser() user: any,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    return this.projectsService.create(user.id, createProjectDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get my projects',
    description: 'Get all projects I own or am a member of',
  })
  @ApiResponse({ status: 200, description: 'List of projects' })
  async getMyProjects(
    @CurrentUser() user: any,
    @Query('includeArchived') includeArchived?: string,
  ) {
    return this.projectsService.getMyProjects(user.id, includeArchived === 'true');
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get project details',
    description: 'Get a specific project with all documents',
  })
  @ApiResponse({ status: 200, description: 'Project details' })
  @ApiResponse({ status: 403, description: 'No access to this project' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async getProject(@Param('id') id: string, @CurrentUser() user: any) {
    return this.projectsService.getProject(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update project',
    description: 'Update project details (owner only)',
  })
  @ApiResponse({ status: 200, description: 'Project updated' })
  @ApiResponse({ status: 403, description: 'Only owner can update' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, user.id, updateProjectDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete project',
    description: 'Delete a project (owner only)',
  })
  @ApiResponse({ status: 200, description: 'Project deleted' })
  @ApiResponse({ status: 403, description: 'Only owner can delete' })
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.projectsService.delete(id, user.id);
  }

  @Post(':id/members/:memberId')
  @ApiOperation({
    summary: 'Add member to project',
    description: 'Add a user to project (owner only)',
  })
  @ApiResponse({ status: 200, description: 'Member added' })
  async addMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.addMember(id, user.id, memberId);
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({
    summary: 'Remove member from project',
    description: 'Remove a user from project (owner only)',
  })
  @ApiResponse({ status: 200, description: 'Member removed' })
  async removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.removeMember(id, user.id, memberId);
  }
}
