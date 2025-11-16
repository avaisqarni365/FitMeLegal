import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class RequestRevisionDto {
  @ApiProperty({
    description: 'Reason for revision request',
    example: 'Please add more details about the non-compete clause',
  })
  @IsString()
  @MaxLength(1000)
  reason: string;
}
