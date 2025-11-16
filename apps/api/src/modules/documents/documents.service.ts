import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { CreateVersionDto } from './dto/create-version.dto';
import { AddCommentDto } from './dto/add-comment.dto';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Upload a new document
   */
  async upload(userId: string, uploadDocumentDto: UploadDocumentDto) {
    const { projectId, name, description, fileUrl, fileSize, mimeType, tags } = uploadDocumentDto;

    // Verify project exists and user has access
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (!this.hasProjectAccess(project, userId)) {
      throw new ForbiddenException('You do not have access to this project');
    }

    // Create document
    const document = await this.prisma.document.create({
      data: {
        projectId,
        uploaderId: userId,
        name,
        description,
        fileUrl,
        fileSize,
        mimeType,
        tags: tags || [],
        currentVersion: 1,
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
    });

    // Create initial version
    await this.prisma.documentVersion.create({
      data: {
        documentId: document.id,
        version: 1,
        fileUrl,
        fileSize,
        uploadedBy: userId,
        changes: 'Initial upload',
      },
    });

    return document;
  }

  /**
   * Get all documents in a project
   */
  async getProjectDocuments(projectId: string, userId: string) {
    // Verify access
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (!this.hasProjectAccess(project, userId)) {
      throw new ForbiddenException('You do not have access to this project');
    }

    const documents = await this.prisma.document.findMany({
      where: { projectId },
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
        _count: {
          select: {
            comments: true,
            versions: true,
          },
        },
      },
    });

    return documents;
  }

  /**
   * Get a specific document
   */
  async getDocument(id: string, userId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        project: true,
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        versions: {
          orderBy: {
            version: 'desc',
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (!this.hasProjectAccess(document.project, userId)) {
      throw new ForbiddenException('You do not have access to this document');
    }

    return document;
  }

  /**
   * Create a new version of a document
   */
  async createVersion(documentId: string, userId: string, createVersionDto: CreateVersionDto) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { project: true },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (!this.hasProjectAccess(document.project, userId)) {
      throw new ForbiddenException('You do not have access to this document');
    }

    const newVersion = document.currentVersion + 1;

    // Create new version
    await this.prisma.documentVersion.create({
      data: {
        documentId,
        version: newVersion,
        fileUrl: createVersionDto.fileUrl,
        fileSize: createVersionDto.fileSize,
        changes: createVersionDto.changes,
        uploadedBy: userId,
      },
    });

    // Update document
    const updated = await this.prisma.document.update({
      where: { id: documentId },
      data: {
        currentVersion: newVersion,
        fileUrl: createVersionDto.fileUrl,
        fileSize: createVersionDto.fileSize,
      },
      include: {
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        versions: {
          orderBy: {
            version: 'desc',
          },
        },
      },
    });

    return updated;
  }

  /**
   * Get all versions of a document
   */
  async getVersions(documentId: string, userId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { project: true },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (!this.hasProjectAccess(document.project, userId)) {
      throw new ForbiddenException('You do not have access to this document');
    }

    const versions = await this.prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: {
        version: 'desc',
      },
    });

    return versions;
  }

  /**
   * Add a comment to a document
   */
  async addComment(documentId: string, userId: string, addCommentDto: AddCommentDto) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { project: true },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (!this.hasProjectAccess(document.project, userId)) {
      throw new ForbiddenException('You do not have access to this document');
    }

    const comment = await this.prisma.documentComment.create({
      data: {
        documentId,
        userId,
        content: addCommentDto.content,
        page: addCommentDto.page,
        positionX: addCommentDto.positionX,
        positionY: addCommentDto.positionY,
        parentId: addCommentDto.parentId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return comment;
  }

  /**
   * Get all comments for a document
   */
  async getComments(documentId: string, userId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { project: true },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (!this.hasProjectAccess(document.project, userId)) {
      throw new ForbiddenException('You do not have access to this document');
    }

    const comments = await this.prisma.documentComment.findMany({
      where: { documentId },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return comments;
  }

  /**
   * Delete a document
   */
  async delete(id: string, userId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Only project owner or document uploader can delete
    if (document.project.ownerId !== userId && document.uploaderId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this document');
    }

    await this.prisma.document.delete({
      where: { id },
    });

    return { success: true, message: 'Document deleted successfully' };
  }

  /**
   * Check if user has access to project
   */
  private hasProjectAccess(project: any, userId: string): boolean {
    if (project.isPublic) return true;
    if (project.ownerId === userId) return true;

    const members = project.members as string[];
    return members.includes(userId);
  }
}
