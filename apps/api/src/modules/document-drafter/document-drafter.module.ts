import { Module } from '@nestjs/common';
import { DocumentDrafterController } from './document-drafter.controller';
import { DocumentDrafterService } from './document-drafter.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { TemplatesModule } from '../templates/templates.module';

@Module({
  imports: [PrismaModule, TemplatesModule],
  controllers: [DocumentDrafterController],
  providers: [DocumentDrafterService],
  exports: [DocumentDrafterService],
})
export class DocumentDrafterModule {}
