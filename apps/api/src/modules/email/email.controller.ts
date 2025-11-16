import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailService } from './email.service';
import { UpdateEmailPreferencesDto } from './dto/update-preferences.dto';

@ApiTags('Email')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get('preferences')
  @ApiOperation({ summary: 'Get my email preferences' })
  getPreferences(@Request() req) {
    return this.emailService.getPreferences(req.user.userId);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update my email preferences' })
  updatePreferences(
    @Request() req,
    @Body() updatePreferencesDto: UpdateEmailPreferencesDto,
  ) {
    return this.emailService.updatePreferences(req.user.userId, updatePreferencesDto);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get my email logs' })
  getEmailLogs(@Request() req) {
    return this.emailService.getEmailLogs(req.user.userId);
  }
}
