import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new document template
   */
  async create(userId: string, createTemplateDto: CreateTemplateDto) {
    const template = await this.prisma.documentTemplate.create({
      data: {
        creatorId: userId,
        name: createTemplateDto.name,
        description: createTemplateDto.description,
        category: createTemplateDto.category,
        subcategory: createTemplateDto.subcategory,
        templateContent: createTemplateDto.templateContent,
        variables: createTemplateDto.variables || [],
        isPublic: createTemplateDto.isPublic || false,
        price: createTemplateDto.price,
        tags: createTemplateDto.tags || [],
        language: createTemplateDto.language || 'en',
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return template;
  }

  /**
   * Get all templates (public templates + user's own templates)
   */
  async getTemplates(userId: string, filters?: {
    category?: string;
    language?: string;
    isPublic?: boolean;
  }) {
    const where: any = {
      OR: [
        { isPublic: true, active: true },
        { creatorId: userId },
      ],
    };

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.language) {
      where.language = filters.language;
    }

    const templates = await this.prisma.documentTemplate.findMany({
      where,
      orderBy: {
        usageCount: 'desc',
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return templates;
  }

  /**
   * Get user's own templates
   */
  async getMyTemplates(userId: string) {
    const templates = await this.prisma.documentTemplate.findMany({
      where: { creatorId: userId },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return templates;
  }

  /**
   * Get a specific template
   */
  async getTemplate(id: string, userId: string) {
    const template = await this.prisma.documentTemplate.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Check access: must be public or owned by user
    if (!template.isPublic && template.creatorId !== userId) {
      throw new ForbiddenException('You do not have access to this template');
    }

    return template;
  }

  /**
   * Update a template
   */
  async update(id: string, userId: string, updateTemplateDto: UpdateTemplateDto) {
    const template = await this.prisma.documentTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Only creator can update
    if (template.creatorId !== userId) {
      throw new ForbiddenException('Only the template creator can update it');
    }

    const updated = await this.prisma.documentTemplate.update({
      where: { id },
      data: updateTemplateDto,
      include: {
        creator: {
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
   * Delete a template
   */
  async delete(id: string, userId: string) {
    const template = await this.prisma.documentTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Only creator can delete
    if (template.creatorId !== userId) {
      throw new ForbiddenException('Only the template creator can delete it');
    }

    await this.prisma.documentTemplate.delete({
      where: { id },
    });

    return { success: true, message: 'Template deleted successfully' };
  }

  /**
   * Fill a template with variable values
   * Returns the filled content (doesn't save as drafted document)
   */
  fillTemplate(templateContent: string, variables: Record<string, string>): string {
    let filledContent = templateContent;

    // Replace all {{variable_name}} with actual values
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      filledContent = filledContent.replace(regex, value);
    }

    return filledContent;
  }

  /**
   * Increment usage count when template is used
   */
  async incrementUsage(templateId: string) {
    await this.prisma.documentTemplate.update({
      where: { id: templateId },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });
  }
}
