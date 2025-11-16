export enum AnswerStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export interface Answer {
  id: string;
  questionId: string;
  advisorId: string;
  content: string;
  price: number;
  status: AnswerStatus;
  attachments: Attachment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
}

export interface CreateAnswerDto {
  questionId: string;
  content: string;
  price: number;
  attachments?: Attachment[];
}

export interface UpdateAnswerDto {
  content?: string;
  price?: number;
  status?: AnswerStatus;
}
