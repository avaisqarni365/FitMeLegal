import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { LoggerModule } from '../logger/logger.module';

@Global()
@Module({
  imports: [PrismaModule, LoggerModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
