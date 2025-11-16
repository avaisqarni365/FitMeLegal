import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { VideoMeetingsService } from './video-meetings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ScheduleMeetingDto } from './dto/schedule-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { CancelMeetingDto } from './dto/cancel-meeting.dto';
import { MeetingFilterDto } from './dto/meeting-filter.dto';

@ApiTags('video-meetings')
@Controller('video-meetings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VideoMeetingsController {
  constructor(private readonly videoMeetingsService: VideoMeetingsService) {}

  @Post()
  @ApiOperation({
    summary: 'Schedule a new video meeting',
    description: 'Create a new scheduled video meeting with another user',
  })
  @ApiResponse({ status: 201, description: 'Meeting scheduled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid schedule or participants' })
  async scheduleMeeting(
    @CurrentUser() user: any,
    @Body() scheduleMeetingDto: ScheduleMeetingDto,
  ) {
    return this.videoMeetingsService.scheduleMeeting(user.id, scheduleMeetingDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get my meetings',
    description: 'Get all meetings where I am organizer or attendee',
  })
  @ApiResponse({ status: 200, description: 'List of meetings' })
  async getMyMeetings(
    @CurrentUser() user: any,
    @Query() filterDto: MeetingFilterDto,
  ) {
    return this.videoMeetingsService.getMyMeetings(user.id, filterDto);
  }

  @Get('upcoming')
  @ApiOperation({
    summary: 'Get upcoming meetings',
    description: 'Get next 10 scheduled upcoming meetings',
  })
  @ApiResponse({ status: 200, description: 'List of upcoming meetings' })
  async getUpcomingMeetings(@CurrentUser() user: any) {
    return this.videoMeetingsService.getUpcomingMeetings(user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get meeting details',
    description: 'Get details of a specific meeting',
  })
  @ApiResponse({ status: 200, description: 'Meeting details' })
  @ApiResponse({ status: 403, description: 'Not a participant of this meeting' })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  async getMeeting(@Param('id') id: string, @CurrentUser() user: any) {
    return this.videoMeetingsService.getMeeting(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update meeting',
    description: 'Update meeting details (organizer only)',
  })
  @ApiResponse({ status: 200, description: 'Meeting updated' })
  @ApiResponse({ status: 403, description: 'Only organizer can update' })
  async updateMeeting(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateMeetingDto: UpdateMeetingDto,
  ) {
    return this.videoMeetingsService.updateMeeting(id, user.id, updateMeetingDto);
  }

  @Post(':id/join')
  @ApiOperation({
    summary: 'Join a meeting',
    description: 'Get meeting room URL and start the session',
  })
  @ApiResponse({ status: 200, description: 'Meeting room details' })
  @ApiResponse({ status: 400, description: 'Meeting cancelled or already ended' })
  async joinMeeting(@Param('id') id: string, @CurrentUser() user: any) {
    return this.videoMeetingsService.joinMeeting(id, user.id);
  }

  @Post(':id/end')
  @ApiOperation({
    summary: 'End a meeting',
    description: 'End an in-progress meeting and calculate duration',
  })
  @ApiResponse({ status: 200, description: 'Meeting ended successfully' })
  @ApiResponse({ status: 400, description: 'Meeting is not in progress' })
  async endMeeting(@Param('id') id: string, @CurrentUser() user: any) {
    return this.videoMeetingsService.endMeeting(id, user.id);
  }

  @Post(':id/cancel')
  @ApiOperation({
    summary: 'Cancel a meeting',
    description: 'Cancel a scheduled or in-progress meeting',
  })
  @ApiResponse({ status: 200, description: 'Meeting cancelled' })
  @ApiResponse({ status: 400, description: 'Cannot cancel completed meeting' })
  async cancelMeeting(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() cancelMeetingDto: CancelMeetingDto,
  ) {
    return this.videoMeetingsService.cancelMeeting(id, user.id, cancelMeetingDto);
  }
}
