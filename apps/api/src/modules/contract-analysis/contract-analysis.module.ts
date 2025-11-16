import { Module } from '@nestjs/common';
import { ContractAnalysisController } from './contract-analysis.controller';
import { ContractAnalysisService } from './contract-analysis.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ContractAnalysisController],
  providers: [ContractAnalysisService],
  exports: [ContractAnalysisService],
})
export class ContractAnalysisModule {}
