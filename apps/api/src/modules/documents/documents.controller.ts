import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { CreateVersionDto } from './dto/create-version.dto';
import { AddCommentDto } from './dto/add-comment.dto';

@ApiTags('documents')
@Controller('documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @ApiOperation({
    summary: 'Upload a document',
    description: 'Upload a new document to a project',
  })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  async upload(
    @CurrentUser() user: any,
    @Body() uploadDocumentDto: UploadDocumentDto,
  ) {
    return this.documentsService.upload(user.id, uploadDocumentDto);
  }

  @Get('project/:projectId')
  @ApiOperation({
    summary: 'Get project documents',
    description: 'Get all documents in a project',
  })
  @ApiResponse({ status: 200, description: 'List of documents' })
  async getProjectDocuments(
    @Param('projectId') projectId: string,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.getProjectDocuments(projectId, user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get document details',
    description: 'Get a specific document with all versions',
  })
  @ApiResponse({ status: 200, description: 'Document details' })
  async getDocument(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.getDocument(id, user.id);
  }

  @Post(':id/versions')
  @ApiOperation({
    summary: 'Create new version',
    description: 'Create a new version of a document',
  })
  @ApiResponse({ status: 201, description: 'Version created successfully' })
  async createVersion(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() createVersionDto: CreateVersionDto,
  ) {
    return this.documentsService.createVersion(id, user.id, createVersionDto);
  }

  @Get(':id/versions')
  @ApiOperation({
    summary: 'Get document versions',
    description: 'Get all versions of a document',
  })
  @ApiResponse({ status: 200, description: 'List of versions' })
  async getVersions(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.getVersions(id, user.id);
  }

  @Post(':id/comments')
  @ApiOperation({
    summary: 'Add comment',
    description: 'Add a comment/annotation to a document',
  })
  @ApiResponse({ status: 201, description: 'Comment added successfully' })
  async addComment(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() addCommentDto: AddCommentDto,
  ) {
    return this.documentsService.addComment(id, user.id, addCommentDto);
  }

  @Get(':id/comments')
  @ApiOperation({
    summary: 'Get document comments',
    description: 'Get all comments for a document',
  })
  @ApiResponse({ status: 200, description: 'List of comments' })
  async getComments(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.getComments(id, user.id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete document',
    description: 'Delete a document (owner or uploader only)',
  })
  @ApiResponse({ status: 200, description: 'Document deleted' })
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.delete(id, user.id);
  }
}
