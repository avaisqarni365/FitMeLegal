import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ScheduleMeetingDto } from './dto/schedule-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { CancelMeetingDto } from './dto/cancel-meeting.dto';
import { MeetingFilterDto } from './dto/meeting-filter.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class VideoMeetingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Schedule a new video meeting
   */
  async scheduleMeeting(organizerId: string, scheduleMeetingDto: ScheduleMeetingDto) {
    const {
      attendeeId,
      title,
      description,
      scheduledStart,
      scheduledEnd,
      timezone,
      recordingEnabled,
      orderId,
    } = scheduleMeetingDto;

    // Validate times
    const startTime = new Date(scheduledStart);
    const endTime = new Date(scheduledEnd);

    if (startTime >= endTime) {
      throw new BadRequestException('End time must be after start time');
    }

    if (startTime < new Date()) {
      throw new BadRequestException('Cannot schedule a meeting in the past');
    }

    // Check if attendee exists
    const attendee = await this.prisma.user.findUnique({
      where: { id: attendeeId },
    });

    if (!attendee) {
      throw new NotFoundException('Attendee not found');
    }

    // Prevent self-meeting
    if (organizerId === attendeeId) {
      throw new BadRequestException('Cannot schedule a meeting with yourself');
    }

    // Generate room ID and URL (placeholder for video provider)
    const roomId = this.generateRoomId();
    const roomUrl = `https://meet.fitmelegal.com/${roomId}`;

    // Create meeting
    const meeting = await this.prisma.videoMeeting.create({
      data: {
        organizerId,
        attendeeId,
        title,
        description,
        scheduledStart: startTime,
        scheduledEnd: endTime,
        timezone: timezone || 'UTC',
        recordingEnabled: recordingEnabled || false,
        orderId,
        roomId,
        roomUrl,
        status: 'SCHEDULED',
      },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
        attendee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return meeting;
  }

  /**
   * Get all meetings for a user (organized or attending)
   */
  async getMyMeetings(userId: string, filterDto: MeetingFilterDto) {
    const { status, page, limit } = filterDto;
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [
        { organizerId: userId },
        { attendeeId: userId },
      ],
    };

    if (status) {
      where.status = status;
    }

    const [meetings, total] = await Promise.all([
      this.prisma.videoMeeting.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          scheduledStart: 'desc',
        },
        include: {
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
            },
          },
          attendee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.videoMeeting.count({ where }),
    ]);

    return {
      data: meetings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a specific meeting
   */
  async getMeeting(id: string, userId: string) {
    const meeting = await this.prisma.videoMeeting.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
        attendee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    // Verify user is participant
    if (meeting.organizerId !== userId && meeting.attendeeId !== userId) {
      throw new ForbiddenException('You are not a participant of this meeting');
    }

    return meeting;
  }

  /**
   * Update a meeting (only organizer can update)
   */
  async updateMeeting(
    id: string,
    userId: string,
    updateMeetingDto: UpdateMeetingDto,
  ) {
    const meeting = await this.prisma.videoMeeting.findUnique({
      where: { id },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    if (meeting.organizerId !== userId) {
      throw new ForbiddenException('Only the organizer can update the meeting');
    }

    if (meeting.status !== 'SCHEDULED') {
      throw new BadRequestException(
        'Can only update scheduled meetings',
      );
    }

    // Validate new times if provided
    if (updateMeetingDto.scheduledStart || updateMeetingDto.scheduledEnd) {
      const newStart = updateMeetingDto.scheduledStart
        ? new Date(updateMeetingDto.scheduledStart)
        : meeting.scheduledStart;
      const newEnd = updateMeetingDto.scheduledEnd
        ? new Date(updateMeetingDto.scheduledEnd)
        : meeting.scheduledEnd;

      if (newStart >= newEnd) {
        throw new BadRequestException('End time must be after start time');
      }
    }

    const updated = await this.prisma.videoMeeting.update({
      where: { id },
      data: {
        ...updateMeetingDto,
        scheduledStart: updateMeetingDto.scheduledStart
          ? new Date(updateMeetingDto.scheduledStart)
          : undefined,
        scheduledEnd: updateMeetingDto.scheduledEnd
          ? new Date(updateMeetingDto.scheduledEnd)
          : undefined,
      },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        attendee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Join a meeting (start the session)
   */
  async joinMeeting(id: string, userId: string) {
    const meeting = await this.getMeeting(id, userId);

    if (meeting.status === 'CANCELLED') {
      throw new BadRequestException('This meeting has been cancelled');
    }

    if (meeting.status === 'COMPLETED') {
      throw new BadRequestException('This meeting has already ended');
    }

    // Start the meeting if not already started
    if (meeting.status === 'SCHEDULED') {
      await this.prisma.videoMeeting.update({
        where: { id },
        data: {
          status: 'IN_PROGRESS',
          actualStart: new Date(),
        },
      });
    }

    return {
      meetingId: meeting.id,
      roomUrl: meeting.roomUrl,
      roomId: meeting.roomId,
      recordingEnabled: meeting.recordingEnabled,
      message: 'You can now join the meeting',
    };
  }

  /**
   * End a meeting (complete the session)
   */
  async endMeeting(id: string, userId: string) {
    const meeting = await this.getMeeting(id, userId);

    if (meeting.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Meeting is not in progress');
    }

    const actualEnd = new Date();
    const durationMinutes = meeting.actualStart
      ? Math.round((actualEnd.getTime() - meeting.actualStart.getTime()) / 60000)
      : 0;

    const completed = await this.prisma.videoMeeting.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        actualEnd,
        durationMinutes,
      },
      include: {
        organizer: true,
        attendee: true,
      },
    });

    // Track video minutes usage for both participants
    // This would integrate with subscription usage tracking
    // For now, we'll just return the completed meeting

    return {
      ...completed,
      message: `Meeting completed. Duration: ${durationMinutes} minutes`,
    };
  }

  /**
   * Cancel a meeting
   */
  async cancelMeeting(
    id: string,
    userId: string,
    cancelMeetingDto: CancelMeetingDto,
  ) {
    const meeting = await this.getMeeting(id, userId);

    if (meeting.status === 'COMPLETED') {
      throw new BadRequestException('Cannot cancel a completed meeting');
    }

    if (meeting.status === 'CANCELLED') {
      throw new BadRequestException('Meeting is already cancelled');
    }

    const cancelled = await this.prisma.videoMeeting.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledBy: userId,
        cancellationReason: cancelMeetingDto.reason,
      },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        attendee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return cancelled;
  }

  /**
   * Get upcoming meetings for a user
   */
  async getUpcomingMeetings(userId: string) {
    const now = new Date();

    const meetings = await this.prisma.videoMeeting.findMany({
      where: {
        OR: [
          { organizerId: userId },
          { attendeeId: userId },
        ],
        status: 'SCHEDULED',
        scheduledStart: {
          gte: now,
        },
      },
      take: 10,
      orderBy: {
        scheduledStart: 'asc',
      },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        attendee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return meetings;
  }

  /**
   * Generate a unique room ID for video provider
   */
  private generateRoomId(): string {
    return randomBytes(16).toString('hex');
  }
}
