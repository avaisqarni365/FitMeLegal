import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateServiceDto } from './create-service.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateServiceDto extends PartialType(CreateServiceDto) {
  @ApiProperty({
    description: 'Mark service as featured',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiProperty({
    description: 'Mark service as active/inactive',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
