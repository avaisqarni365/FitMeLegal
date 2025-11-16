import { Module } from '@nestjs/common';
import { VideoMeetingsController } from './video-meetings.controller';
import { VideoMeetingsService } from './video-meetings.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VideoMeetingsController],
  providers: [VideoMeetingsService],
  exports: [VideoMeetingsService],
})
export class VideoMeetingsModule {}
