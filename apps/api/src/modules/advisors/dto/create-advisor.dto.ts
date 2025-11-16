import { IsEnum, IsArray, IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdvisorType } from '@fitmelegal/shared';

export class CreateAdvisorDto {
  @ApiProperty({ enum: AdvisorType, example: AdvisorType.LAWYER })
  @IsEnum(AdvisorType)
  advisorType: AdvisorType;

  @ApiProperty({ type: [String], example: ['corporate', 'employment'] })
  @IsArray()
  @IsString({ each: true })
  specializations: string[];

  @ApiProperty({ type: [String], example: ['en', 'de'] })
  @IsArray()
  @IsString({ each: true })
  languages: string[];

  @ApiPropertyOptional({ example: 'BAR12345' })
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional({ example: 'German Bar Association' })
  @IsOptional()
  @IsString()
  barAssociation?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(60)
  yearsExperience?: number;

  @ApiPropertyOptional({ example: 'Experienced corporate lawyer specializing in M&A' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: 150.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;
}
