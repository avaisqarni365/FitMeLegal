import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MessagingService } from './messaging.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ConversationFilterDto } from './dto/conversation-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('messaging')
@Controller('messaging')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Start a new conversation' })
  @ApiResponse({ status: 201, description: 'Conversation created' })
  @ApiResponse({
    status: 400,
    description: 'Cannot message yourself or invalid receiver',
  })
  @ApiResponse({ status: 404, description: 'Receiver not found' })
  async createConversation(
    @CurrentUser() user: any,
    @Body() createConversationDto: CreateConversationDto,
  ) {
    return this.messagingService.createConversation(
      user.id,
      createConversationDto,
    );
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get all my conversations' })
  @ApiResponse({ status: 200, description: 'List of conversations' })
  async getConversations(
    @CurrentUser() user: any,
    @Query() filterDto: ConversationFilterDto,
  ) {
    return this.messagingService.getConversations(user.id, filterDto);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get a specific conversation' })
  @ApiResponse({ status: 200, description: 'Conversation details' })
  @ApiResponse({ status: 403, description: 'Not part of conversation' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getConversation(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.messagingService.getConversation(id, user.id);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get messages in a conversation' })
  @ApiResponse({ status: 200, description: 'List of messages' })
  @ApiResponse({ status: 403, description: 'Not part of conversation' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getMessages(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.messagingService.getMessages(
      id,
      user.id,
      page || 1,
      limit || 50,
    );
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send a message in a conversation' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  @ApiResponse({ status: 403, description: 'Not part of conversation' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async sendMessage(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    return this.messagingService.sendMessage(id, user.id, sendMessageDto);
  }

  @Post('conversations/:id/mark-read')
  @ApiOperation({ summary: 'Mark all messages in conversation as read' })
  @ApiResponse({ status: 200, description: 'Marked as read' })
  @ApiResponse({ status: 403, description: 'Not part of conversation' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.messagingService.markAsRead(id, user.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get total unread message count' })
  @ApiResponse({ status: 200, description: 'Unread count' })
  async getUnreadCount(@CurrentUser() user: any) {
    return this.messagingService.getUnreadCount(user.id);
  }
}
