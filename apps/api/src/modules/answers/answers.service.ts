import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { UpdateAnswerDto } from './dto/update-answer.dto';

@Injectable()
export class AnswersService {
  constructor(private prisma: PrismaService) {}

  async create(questionId: string, advisorUserId: string, createAnswerDto: CreateAnswerDto) {
    // Check if question exists and is still open
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    if (question.status !== 'OPEN') {
      throw new BadRequestException('Question is no longer accepting answers');
    }

    // Get advisor profile
    const advisor = await this.prisma.advisor.findUnique({
      where: { userId: advisorUserId },
    });

    if (!advisor) {
      throw new NotFoundException('Advisor profile not found');
    }

    // Check if advisor already answered this question
    const existingAnswer = await this.prisma.answer.findFirst({
      where: {
        questionId,
        advisorId: advisor.id,
      },
    });

    if (existingAnswer) {
      throw new BadRequestException('You have already answered this question');
    }

    // Create answer
    return this.prisma.answer.create({
      data: {
        questionId,
        advisorId: advisor.id,
        content: createAnswerDto.content,
        price: createAnswerDto.price,
        attachments: createAnswerDto.attachments || [],
      },
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
        question: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
    });
  }

  async findByQuestion(questionId: string) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    return this.prisma.answer.findMany({
      where: { questionId },
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
    });
  }

  async findOne(id: string) {
    const answer = await this.prisma.answer.findUnique({
      where: { id },
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
        question: {
          select: {
            id: true,
            title: true,
            category: true,
            subcategory: true,
          },
        },
      },
    });

    if (!answer) {
      throw new NotFoundException('Answer not found');
    }

    return answer;
  }

  async findMyAnswers(advisorUserId: string) {
    const advisor = await this.prisma.advisor.findUnique({
      where: { userId: advisorUserId },
    });

    if (!advisor) {
      throw new NotFoundException('Advisor profile not found');
    }

    return this.prisma.answer.findMany({
      where: { advisorId: advisor.id },
      include: {
        question: {
          select: {
            id: true,
            title: true,
            category: true,
            subcategory: true,
            status: true,
            budget: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(id: string, advisorUserId: string, updateAnswerDto: UpdateAnswerDto) {
    const answer = await this.prisma.answer.findUnique({
      where: { id },
      include: {
        advisor: true,
      },
    });

    if (!answer) {
      throw new NotFoundException('Answer not found');
    }

    if (answer.advisor.userId !== advisorUserId) {
      throw new ForbiddenException('You can only update your own answers');
    }

    if (answer.status !== 'PENDING') {
      throw new BadRequestException('Cannot update answer that has been accepted or rejected');
    }

    return this.prisma.answer.update({
      where: { id },
      data: updateAnswerDto,
      include: {
        advisor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  async remove(id: string, advisorUserId: string) {
    const answer = await this.prisma.answer.findUnique({
      where: { id },
      include: {
        advisor: true,
      },
    });

    if (!answer) {
      throw new NotFoundException('Answer not found');
    }

    if (answer.advisor.userId !== advisorUserId) {
      throw new ForbiddenException('You can only delete your own answers');
    }

    if (answer.status !== 'PENDING') {
      throw new BadRequestException('Cannot delete answer that has been accepted or rejected');
    }

    await this.prisma.answer.delete({
      where: { id },
    });

    return { message: 'Answer deleted successfully' };
  }
}
