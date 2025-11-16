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
import { DocumentDrafterService } from './document-drafter.service';
import { DraftDocumentDto } from './dto/draft-document.dto';
import { FillTemplateDto } from '../templates/dto/fill-template.dto';

@ApiTags('Document Drafter')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('document-drafter')
export class DocumentDrafterController {
  constructor(
    private readonly documentDrafterService: DocumentDrafterService,
  ) {}

  @Post('draft-from-prompt')
  @ApiOperation({ summary: 'Draft a document from AI prompt (free-form)' })
  draftFromPrompt(@Request() req, @Body() draftDocumentDto: DraftDocumentDto) {
    return this.documentDrafterService.draftFromPrompt(
      req.user.userId,
      draftDocumentDto,
    );
  }

  @Post('draft-from-template')
  @ApiOperation({ summary: 'Draft a document from a template' })
  draftFromTemplate(@Request() req, @Body() fillTemplateDto: FillTemplateDto) {
    return this.documentDrafterService.draftFromTemplate(
      req.user.userId,
      fillTemplateDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all my drafted documents' })
  getMyDrafts(@Request() req, @Query('status') status?: string) {
    return this.documentDrafterService.getMyDrafts(req.user.userId, { status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get draft by ID' })
  getDraft(@Param('id') id: string, @Request() req) {
    return this.documentDrafterService.getDraft(id, req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update draft content or status' })
  updateDraft(
    @Param('id') id: string,
    @Request() req,
    @Body() updates: {
      title?: string;
      description?: string;
      generatedContent?: string;
      status?: 'DRAFT' | 'REVIEWING' | 'FINALIZED';
    },
  ) {
    return this.documentDrafterService.updateDraft(id, req.user.userId, updates);
  }

  @Post(':id/regenerate')
  @ApiOperation({ summary: 'Regenerate draft with AI (prompt-based only)' })
  regenerateDraft(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { newPrompt?: string },
  ) {
    return this.documentDrafterService.regenerateDraft(
      id,
      req.user.userId,
      body.newPrompt,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a draft' })
  deleteDraft(@Param('id') id: string, @Request() req) {
    return this.documentDrafterService.deleteDraft(id, req.user.userId);
  }

  @Post(':id/save-to-workspace')
  @ApiOperation({ summary: 'Save draft to document workspace' })
  saveDraftToWorkspace(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { projectId: string },
  ) {
    return this.documentDrafterService.saveDraftToWorkspace(
      id,
      req.user.userId,
      body.projectId,
    );
  }
}
