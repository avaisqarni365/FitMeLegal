import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateEmailPreferencesDto {
  @ApiProperty({ description: 'Receive order update emails', required: false })
  @IsOptional()
  @IsBoolean()
  orderUpdates?: boolean;

  @ApiProperty({ description: 'Receive question answer emails', required: false })
  @IsOptional()
  @IsBoolean()
  questionAnswers?: boolean;

  @ApiProperty({ description: 'Receive new message emails', required: false })
  @IsOptional()
  @IsBoolean()
  newMessages?: boolean;

  @ApiProperty({ description: 'Receive meeting reminder emails', required: false })
  @IsOptional()
  @IsBoolean()
  meetingReminders?: boolean;

  @ApiProperty({ description: 'Receive subscription update emails', required: false })
  @IsOptional()
  @IsBoolean()
  subscriptionUpdates?: boolean;

  @ApiProperty({ description: 'Receive marketing emails', required: false })
  @IsOptional()
  @IsBoolean()
  marketingEmails?: boolean;

  @ApiProperty({ description: 'Receive weekly digest emails', required: false })
  @IsOptional()
  @IsBoolean()
  weeklyDigest?: boolean;

  @ApiProperty({ description: 'Receive platform notifications', required: false })
  @IsOptional()
  @IsBoolean()
  platformNotifications?: boolean;
}
