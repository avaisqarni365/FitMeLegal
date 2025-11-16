import { IsEmail, IsString, MinLength, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserType } from '@fitmelegal/shared';
import {
  IsStrongPassword,
  IsNotXSS,
  IsNotSQLInjection,
  IsPhoneNumber,
} from '../../../common/decorators/validation.decorator';

export class RegisterDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @IsStrongPassword()
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.CLIENT })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ enum: UserType, example: UserType.PRIVATE })
  @IsOptional()
  @IsEnum(UserType)
  userType?: UserType;

  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsNotXSS()
  @IsNotSQLInjection()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsNotXSS()
  @IsNotSQLInjection()
  lastName: string;

  @ApiPropertyOptional({ example: '(555) 123-4567' })
  @IsOptional()
  @IsString()
  @IsPhoneNumber()
  phone?: string;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ example: 'Europe/Berlin' })
  @IsOptional()
  @IsString()
  timezone?: string;
}
