import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Basic health check' })
  async healthCheck() {
    return this.healthService.getHealth();
  }

  @Get('ready')
  @Public()
  @ApiOperation({ summary: 'Readiness check' })
  async readinessCheck() {
    return this.healthService.getReadiness();
  }

  @Get('live')
  @Public()
  @ApiOperation({ summary: 'Liveness check' })
  async livenessCheck() {
    return this.healthService.getLiveness();
  }

  @Get('metrics')
  @Public()
  @ApiOperation({ summary: 'System metrics' })
  async getMetrics() {
    return this.healthService.getMetrics();
  }
}
