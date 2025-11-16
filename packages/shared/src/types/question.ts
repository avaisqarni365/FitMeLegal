export enum QuestionCategory {
  LEGAL = 'LEGAL',
  TAX = 'TAX',
}

export enum QuestionStatus {
  OPEN = 'OPEN',
  ANSWERED = 'ANSWERED',
  CLOSED = 'CLOSED',
  DISPUTED = 'DISPUTED',
}

export enum UrgencyLevel {
  NORMAL = 'NORMAL',
  URGENT = 'URGENT',
  CRITICAL = 'CRITICAL',
}

export interface Question {
  id: string;
  userId: string;
  category: QuestionCategory;
  subcategory: string;
  title: string;
  description: string;
  language: string;
  budget: number;
  urgency: UrgencyLevel;
  status: QuestionStatus;
  selectedAnswerId?: string;
  attachments: Attachment[];
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
}

export interface CreateQuestionDto {
  category: QuestionCategory;
  subcategory: string;
  title: string;
  description: string;
  language?: string;
  budget: number;
  urgency?: UrgencyLevel;
  attachments?: Attachment[];
}

export interface UpdateQuestionDto {
  title?: string;
  description?: string;
  budget?: number;
  urgency?: UrgencyLevel;
  status?: QuestionStatus;
}
