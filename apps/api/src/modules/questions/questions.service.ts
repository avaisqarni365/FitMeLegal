import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionFilterDto } from './dto/question-filter.dto';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createQuestionDto: CreateQuestionDto) {
    return this.prisma.question.create({
      data: {
        userId,
        category: createQuestionDto.category,
        subcategory: createQuestionDto.subcategory,
        title: createQuestionDto.title,
        description: createQuestionDto.description,
        language: createQuestionDto.language || 'en',
        budget: createQuestionDto.budget,
        urgency: createQuestionDto.urgency || 'NORMAL',
        attachments: createQuestionDto.attachments || [],
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async findAll(filterDto: QuestionFilterDto, userId?: string) {
    const { page, limit, sortBy, sortOrder, search, ...filters } = filterDto;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.subcategory) {
      where.subcategory = filters.subcategory;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.urgency) {
      where.urgency = filters.urgency;
    }

    if (filters.minBudget !== undefined || filters.maxBudget !== undefined) {
      where.budget = {};
      if (filters.minBudget !== undefined) {
        where.budget.gte = filters.minBudget;
      }
      if (filters.maxBudget !== undefined) {
        where.budget.lte = filters.maxBudget;
      }
    }

    // Search in title and description
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Execute query
    const [questions, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          answers: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.question.count({ where }),
    ]);

    // Add answer count to each question
    const questionsWithCounts = questions.map((q) => ({
      ...q,
      answerCount: q.answers.length,
      answers: undefined, // Remove full answers array from response
    }));

    return {
      data: questionsWithCounts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId?: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        answers: {
          include: {
            advisor: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Increment view count
    await this.prisma.question.update({
      where: { id },
      data: {
        views: {
          increment: 1,
        },
      },
    });

    return question;
  }

  async findMyQuestions(userId: string, filterDto: QuestionFilterDto) {
    const { page, limit, sortBy, sortOrder, ...filters } = filterDto;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    const [questions, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          answers: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.question.count({ where }),
    ]);

    const questionsWithCounts = questions.map((q) => ({
      ...q,
      answerCount: q.answers.length,
      answers: undefined,
    }));

    return {
      data: questionsWithCounts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, userId: string, updateQuestionDto: UpdateQuestionDto) {
    const question = await this.prisma.question.findUnique({
      where: { id },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    if (question.userId !== userId) {
      throw new ForbiddenException('You can only update your own questions');
    }

    return this.prisma.question.update({
      where: { id },
      data: updateQuestionDto,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    if (question.userId !== userId) {
      throw new ForbiddenException('You can only delete your own questions');
    }

    await this.prisma.question.delete({
      where: { id },
    });

    return { message: 'Question deleted successfully' };
  }

  async selectAnswer(questionId: string, answerId: string, userId: string) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        answers: true,
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    if (question.userId !== userId) {
      throw new ForbiddenException('Only question owner can select answer');
    }

    const answer = question.answers.find((a) => a.id === answerId);
    if (!answer) {
      throw new NotFoundException('Answer not found');
    }

    // Update question status and selected answer
    const updatedQuestion = await this.prisma.question.update({
      where: { id: questionId },
      data: {
        selectedAnswerId: answerId,
        status: 'ANSWERED',
      },
    });

    // Update answer status to ACCEPTED
    await this.prisma.answer.update({
      where: { id: answerId },
      data: {
        status: 'ACCEPTED',
      },
    });

    // Update other answers to REJECTED
    await this.prisma.answer.updateMany({
      where: {
        questionId,
        id: {
          not: answerId,
        },
      },
      data: {
        status: 'REJECTED',
      },
    });

    return updatedQuestion;
  }
}
