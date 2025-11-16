import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsUUID } from 'class-validator';

export class AddCommentDto {
  @ApiProperty({
    description: 'Comment content',
    example: 'This clause needs to be revised to include the new terms',
  })
  @IsString()
  content: string;

  @ApiProperty({
    description: 'Page number (for PDF annotations)',
    example: 3,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiProperty({
    description: 'X coordinate for annotation position',
    example: 150.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  positionX?: number;

  @ApiProperty({
    description: 'Y coordinate for annotation position',
    example: 200.25,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  positionY?: number;

  @ApiProperty({
    description: 'Parent comment ID for threaded replies',
    example: 'comment-uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
