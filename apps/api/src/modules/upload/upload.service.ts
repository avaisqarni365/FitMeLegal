import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as crypto from 'crypto';

export interface UploadFileOptions {
  userId: string;
  file: Express.Multer.File;
  category: string;
  entityType?: string;
  entityId?: string;
  isPublic?: boolean;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir = process.env.UPLOAD_DIR || './uploads';
  private readonly maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default
  private readonly allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Text
    'text/plain',
    'text/csv',
  ];

  constructor(private prisma: PrismaService) {
    this.ensureUploadDir();
  }

  /**
   * Ensure upload directory exists
   */
  private async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      this.logger.error(`Failed to create upload directory: ${error.message}`);
    }
  }

  /**
   * Upload file (local or S3)
   */
  async uploadFile(options: UploadFileOptions) {
    const { userId, file, category, entityType, entityId, isPublic = false } = options;

    // Validate file
    this.validateFile(file);

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${crypto.randomUUID()}${fileExtension}`;

    // Determine storage provider
    const provider = process.env.STORAGE_PROVIDER || 'local';

    let storagePath: string;
    let storageUrl: string;
    let bucket: string | undefined;

    if (provider === 's3') {
      // TODO: Upload to S3
      const s3Result = await this.uploadToS3(file, fileName, category);
      storagePath = s3Result.key;
      storageUrl = s3Result.url;
      bucket = s3Result.bucket;
    } else {
      // Local storage
      const localResult = await this.uploadToLocal(file, fileName, category);
      storagePath = localResult.path;
      storageUrl = localResult.url;
    }

    // Detect if image
    const isImage = file.mimetype.startsWith('image/');
    let width: number | undefined;
    let height: number | undefined;

    if (isImage) {
      // TODO: Get image dimensions
      // Can use sharp library: const metadata = await sharp(file.buffer).metadata();
    }

    // Create database record
    const upload = await this.prisma.fileUpload.create({
      data: {
        userId,
        originalName: file.originalname,
        fileName,
        fileSize: file.size,
        mimeType: file.mimetype,
        fileExtension: fileExtension.replace('.', ''),
        storageProvider: provider,
        storagePath,
        storageUrl,
        bucket,
        category: category as any,
        entityType,
        entityId,
        isImage,
        width,
        height,
        isPublic,
        status: 'COMPLETED',
        processedAt: new Date(),
      },
    });

    this.logger.log(`File uploaded: ${fileName} by user ${userId}`);

    return upload;
  }

  /**
   * Upload to local filesystem
   */
  private async uploadToLocal(file: Express.Multer.File, fileName: string, category: string) {
    const categoryDir = path.join(this.uploadDir, category.toLowerCase());
    await fs.mkdir(categoryDir, { recursive: true });

    const filePath = path.join(categoryDir, fileName);
    await fs.writeFile(filePath, file.buffer);

    return {
      path: filePath,
      url: `/uploads/${category.toLowerCase()}/${fileName}`,
    };
  }

  /**
   * Upload to S3 (placeholder - ready for integration)
   */
  private async uploadToS3(file: Express.Multer.File, fileName: string, category: string) {
    // TODO: Implement S3 upload
    // Example with AWS SDK v3:
    /*
    import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
    const s3 = new S3Client({ region: process.env.AWS_REGION });

    const bucket = process.env.S3_BUCKET;
    const key = `${category.toLowerCase()}/${fileName}`;

    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read', // or 'private'
    }));

    return {
      bucket,
      key,
      url: `https://${bucket}.s3.amazonaws.com/${key}`,
    };
    */

    throw new Error('S3 provider not yet configured');
  }

  /**
   * Validate file
   */
  private validateFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File too large. Maximum size is ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }

    // Check MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type not allowed. Allowed types: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    // Additional validations
    this.validateFileName(file.originalname);
  }

  /**
   * Validate filename
   */
  private validateFileName(filename: string) {
    // Check for null bytes
    if (filename.includes('\0')) {
      throw new BadRequestException('Invalid filename');
    }

    // Check for path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new BadRequestException('Invalid filename');
    }

    // Check length
    if (filename.length > 255) {
      throw new BadRequestException('Filename too long');
    }
  }

  /**
   * Get file by ID
   */
  async getFile(id: string, userId: string) {
    const file = await this.prisma.fileUpload.findUnique({
      where: { id },
    });

    if (!file) {
      throw new BadRequestException('File not found');
    }

    // Check access
    if (!file.isPublic && file.userId !== userId) {
      throw new BadRequestException('Access denied');
    }

    return file;
  }

  /**
   * Get user's files
   */
  async getUserFiles(userId: string, category?: string) {
    const where: any = { userId };

    if (category) {
      where.category = category;
    }

    return this.prisma.fileUpload.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Delete file
   */
  async deleteFile(id: string, userId: string) {
    const file = await this.getFile(id, userId);

    // Delete from storage
    if (file.storageProvider === 'local') {
      try {
        await fs.unlink(file.storagePath);
      } catch (error) {
        this.logger.error(`Failed to delete file from storage: ${error.message}`);
      }
    } else if (file.storageProvider === 's3') {
      // TODO: Delete from S3
    }

    // Delete from database
    await this.prisma.fileUpload.delete({
      where: { id },
    });

    return { success: true, message: 'File deleted successfully' };
  }

  /**
   * Update avatar
   */
  async updateAvatar(userId: string, file: Express.Multer.File) {
    // Delete old avatar
    const oldAvatars = await this.prisma.fileUpload.findMany({
      where: { userId, category: 'AVATAR' },
    });

    for (const oldAvatar of oldAvatars) {
      await this.deleteFile(oldAvatar.id, userId);
    }

    // Upload new avatar
    const upload = await this.uploadFile({
      userId,
      file,
      category: 'AVATAR',
      isPublic: true,
    });

    // Update user record
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: upload.storageUrl },
    });

    return upload;
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(userId: string) {
    const files = await this.prisma.fileUpload.findMany({
      where: { userId },
      select: { fileSize: true, category: true },
    });

    const totalSize = files.reduce((sum, file) => sum + file.fileSize, 0);
    const byCategory = files.reduce((acc, file) => {
      acc[file.category] = (acc[file.category] || 0) + file.fileSize;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalFiles: files.length,
      totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      byCategory,
    };
  }
}
