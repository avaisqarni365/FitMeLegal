import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AnswersService } from './answers.service';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { UpdateAnswerDto } from './dto/update-answer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@fitmelegal/shared';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('answers')
@Controller('answers')
export class AnswersController {
  constructor(private readonly answersService: AnswersService) {}

  @Post('question/:questionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit answer to a question (Advisors only)' })
  @ApiResponse({ status: 201, description: 'Answer created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Question not open or already answered' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not an advisor' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async create(
    @Param('questionId') questionId: string,
    @CurrentUser() user: any,
    @Body() createAnswerDto: CreateAnswerDto,
  ) {
    return this.answersService.create(questionId, user.id, createAnswerDto);
  }

  @Get('question/:questionId')
  @Public()
  @ApiOperation({ summary: 'Get all answers for a question (Public)' })
  @ApiResponse({ status: 200, description: 'List of answers' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async findByQuestion(@Param('questionId') questionId: string) {
    return this.answersService.findByQuestion(questionId);
  }

  @Get('my-answers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my answers (Advisor only)' })
  @ApiResponse({ status: 200, description: 'List of my answers' })
  async findMyAnswers(@CurrentUser() user: any) {
    return this.answersService.findMyAnswers(user.id);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get answer by ID (Public)' })
  @ApiResponse({ status: 200, description: 'Answer details' })
  @ApiResponse({ status: 404, description: 'Answer not found' })
  async findOne(@Param('id') id: string) {
    return this.answersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update answer (Owner only, if still pending)' })
  @ApiResponse({ status: 200, description: 'Answer updated' })
  @ApiResponse({ status: 400, description: 'Cannot update accepted/rejected answer' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not owner' })
  @ApiResponse({ status: 404, description: 'Answer not found' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateAnswerDto: UpdateAnswerDto,
  ) {
    return this.answersService.update(id, user.id, updateAnswerDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete answer (Owner only, if still pending)' })
  @ApiResponse({ status: 200, description: 'Answer deleted' })
  @ApiResponse({ status: 400, description: 'Cannot delete accepted/rejected answer' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not owner' })
  @ApiResponse({ status: 404, description: 'Answer not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.answersService.remove(id, user.id);
  }
}
