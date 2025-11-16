import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ContractAnalysisService } from './contract-analysis.service';
import { AnalyzeContractDto } from './dto/analyze-contract.dto';

@ApiTags('Contract Analysis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contract-analysis')
export class ContractAnalysisController {
  constructor(
    private readonly contractAnalysisService: ContractAnalysisService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Analyze a contract with AI' })
  analyzeContract(@Request() req, @Body() analyzeContractDto: AnalyzeContractDto) {
    return this.contractAnalysisService.analyzeContract(
      req.user.userId,
      analyzeContractDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all my contract analyses' })
  getMyAnalyses(@Request() req) {
    return this.contractAnalysisService.getMyAnalyses(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get analysis by ID' })
  getAnalysis(@Param('id') id: string, @Request() req) {
    return this.contractAnalysisService.getAnalysis(id, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an analysis' })
  deleteAnalysis(@Param('id') id: string, @Request() req) {
    return this.contractAnalysisService.deleteAnalysis(id, req.user.userId);
  }
}
