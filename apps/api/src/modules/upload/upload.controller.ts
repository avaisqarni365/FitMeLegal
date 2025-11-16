import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from './upload.service';

@ApiTags('Upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('file')
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        category: { type: 'string', enum: ['AVATAR', 'DOCUMENT', 'ATTACHMENT', 'OTHER'] },
        entityType: { type: 'string' },
        entityId: { type: 'string' },
      },
      required: ['file', 'category'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Query('category') category: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.uploadService.uploadFile({
      userId: req.user.userId,
      file,
      category: category || 'OTHER',
      entityType,
      entityId,
    });
  }

  @Post('avatar')
  @ApiOperation({ summary: 'Upload/update avatar' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.uploadService.updateAvatar(req.user.userId, file);
  }

  @Get('my-files')
  @ApiOperation({ summary: 'Get my uploaded files' })
  getMyFiles(@Request() req, @Query('category') category?: string) {
    return this.uploadService.getUserFiles(req.user.userId, category);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get storage statistics' })
  getStorageStats(@Request() req) {
    return this.uploadService.getStorageStats(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file by ID' })
  getFile(@Param('id') id: string, @Request() req) {
    return this.uploadService.getFile(id, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete file' })
  deleteFile(@Param('id') id: string, @Request() req) {
    return this.uploadService.deleteFile(id, req.user.userId);
  }
}
