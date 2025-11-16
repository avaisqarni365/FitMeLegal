import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class UpdateProjectDto {
  @ApiProperty({
    description: 'Project name',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Project description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Array of user IDs who have access',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  members?: string[];

  @ApiProperty({
    description: 'Public visibility',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({
    description: 'Tags',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({
    description: 'Archive status',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  archived?: boolean;
}
