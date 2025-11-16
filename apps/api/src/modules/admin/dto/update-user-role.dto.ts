import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional } from 'class-validator';

export enum UserRole {
  CLIENT = 'CLIENT',
  ADVISOR = 'ADVISOR',
  ADMIN = 'ADMIN',
}

export class UpdateUserRoleDto {
  @ApiProperty({
    description: 'New role for the user',
    enum: UserRole,
    example: UserRole.ADVISOR,
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    description: 'Reason for role change',
    example: 'User requested advisor status upgrade',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
