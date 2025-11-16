import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new project
   */
  async create(userId: string, createProjectDto: CreateProjectDto) {
    const { name, description, members, isPublic, orderId, tags } = createProjectDto;

    const project = await this.prisma.project.create({
      data: {
        ownerId: userId,
        name,
        description,
        members: members || [],
        isPublic: isPublic || false,
        orderId,
        tags: tags || [],
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return project;
  }

  /**
   * Get all projects for a user (owned or member of)
   */
  async getMyProjects(userId: string, includeArchived = false) {
    const where: any = {
      OR: [
        { ownerId: userId },
        { members: { array_contains: userId } },
      ],
    };

    if (!includeArchived) {
      where.archived = false;
    }

    const projects = await this.prisma.project.findMany({
      where,
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            documents: true,
          },
        },
      },
    });

    return projects;
  }

  /**
   * Get a specific project
   */
  async getProject(id: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        documents: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            uploader: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check access
    if (!this.hasAccess(project, userId)) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return project;
  }

  /**
   * Update a project
   */
  async update(id: string, userId: string, updateProjectDto: UpdateProjectDto) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Only owner can update
    if (project.ownerId !== userId) {
      throw new ForbiddenException('Only the project owner can update the project');
    }

    const updated = await this.prisma.project.update({
      where: { id },
      data: updateProjectDto,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Delete a project
   */
  async delete(id: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.ownerId !== userId) {
      throw new ForbiddenException('Only the project owner can delete the project');
    }

    await this.prisma.project.delete({
      where: { id },
    });

    return { success: true, message: 'Project deleted successfully' };
  }

  /**
   * Add member to project
   */
  async addMember(projectId: string, userId: string, memberIdToAdd: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.ownerId !== userId) {
      throw new ForbiddenException('Only the project owner can add members');
    }

    const currentMembers = project.members as string[];
    if (currentMembers.includes(memberIdToAdd)) {
      return project; // Already a member
    }

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        members: [...currentMembers, memberIdToAdd],
      },
    });

    return updated;
  }

  /**
   * Remove member from project
   */
  async removeMember(projectId: string, userId: string, memberIdToRemove: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.ownerId !== userId) {
      throw new ForbiddenException('Only the project owner can remove members');
    }

    const currentMembers = project.members as string[];
    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        members: currentMembers.filter((id) => id !== memberIdToRemove),
      },
    });

    return updated;
  }

  /**
   * Check if user has access to project
   */
  private hasAccess(project: any, userId: string): boolean {
    if (project.isPublic) return true;
    if (project.ownerId === userId) return true;

    const members = project.members as string[];
    return members.includes(userId);
  }
}
