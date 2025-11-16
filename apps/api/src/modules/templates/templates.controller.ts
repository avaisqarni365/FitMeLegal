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
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@ApiTags('Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new document template' })
  create(@Request() req, @Body() createTemplateDto: CreateTemplateDto) {
    return this.templatesService.create(req.user.userId, createTemplateDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all templates (public + own)' })
  getTemplates(
    @Request() req,
    @Query('category') category?: string,
    @Query('language') language?: string,
  ) {
    return this.templatesService.getTemplates(req.user.userId, {
      category,
      language,
    });
  }

  @Get('my-templates')
  @ApiOperation({ summary: 'Get my templates' })
  getMyTemplates(@Request() req) {
    return this.templatesService.getMyTemplates(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template by ID' })
  getTemplate(@Param('id') id: string, @Request() req) {
    return this.templatesService.getTemplate(id, req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a template' })
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ) {
    return this.templatesService.update(id, req.user.userId, updateTemplateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a template' })
  delete(@Param('id') id: string, @Request() req) {
    return this.templatesService.delete(id, req.user.userId);
  }
}
