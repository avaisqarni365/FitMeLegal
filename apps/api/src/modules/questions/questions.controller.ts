import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionFilterDto } from './dto/question-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@fitmelegal/shared';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('questions')
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new question (Clients only)' })
  @ApiResponse({ status: 201, description: 'Question created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not a client' })
  async create(@CurrentUser() user: any, @Body() createQuestionDto: CreateQuestionDto) {
    return this.questionsService.create(user.id, createQuestionDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all questions (Public with filters)' })
  @ApiResponse({ status: 200, description: 'List of questions' })
  async findAll(@Query() filterDto: QuestionFilterDto, @CurrentUser() user?: any) {
    return this.questionsService.findAll(filterDto, user?.id);
  }

  @Get('my-questions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my questions' })
  @ApiResponse({ status: 200, description: 'List of my questions' })
  async findMyQuestions(@CurrentUser() user: any, @Query() filterDto: QuestionFilterDto) {
    return this.questionsService.findMyQuestions(user.id, filterDto);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get question by ID (Public)' })
  @ApiResponse({ status: 200, description: 'Question details' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user?: any) {
    return this.questionsService.findOne(id, user?.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update question (Owner only)' })
  @ApiResponse({ status: 200, description: 'Question updated' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not owner' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ) {
    return this.questionsService.update(id, user.id, updateQuestionDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete question (Owner only)' })
  @ApiResponse({ status: 200, description: 'Question deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not owner' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.questionsService.remove(id, user.id);
  }

  @Post(':questionId/select-answer/:answerId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Select answer as best answer (Question owner only)' })
  @ApiResponse({ status: 200, description: 'Answer selected successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not question owner' })
  @ApiResponse({ status: 404, description: 'Question or answer not found' })
  async selectAnswer(
    @Param('questionId') questionId: string,
    @Param('answerId') answerId: string,
    @CurrentUser() user: any,
  ) {
    return this.questionsService.selectAnswer(questionId, answerId, user.id);
  }
}
