import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DraftDocumentDto } from './dto/draft-document.dto';
import { FillTemplateDto } from '../templates/dto/fill-template.dto';
import { TemplatesService } from '../templates/templates.service';

@Injectable()
export class DocumentDrafterService {
  constructor(
    private prisma: PrismaService,
    private templatesService: TemplatesService,
  ) {}

  /**
   * Draft a document from a user prompt (free-form AI generation)
   */
  async draftFromPrompt(userId: string, draftDocumentDto: DraftDocumentDto) {
    const { title, userPrompt, description, projectId } = draftDocumentDto;

    // TODO: In production, call AI API to generate document
    const generatedContent = await this.generateFromPrompt(userPrompt);

    const draft = await this.prisma.draftedDocument.create({
      data: {
        userId,
        title,
        description,
        userPrompt,
        generatedContent,
        projectId,
        aiModel: 'gpt-4', // or 'claude-3-opus'
        tokensUsed: 3500,
        status: 'DRAFT',
      },
    });

    return draft;
  }

  /**
   * Draft a document from a template
   */
  async draftFromTemplate(userId: string, fillTemplateDto: FillTemplateDto) {
    const { templateId, variables, title, description } = fillTemplateDto;

    // Get template
    const template = await this.templatesService.getTemplate(templateId, userId);

    // Fill template with variables
    const generatedContent = this.templatesService.fillTemplate(
      template.templateContent,
      variables,
    );

    // Increment template usage
    await this.templatesService.incrementUsage(templateId);

    // Create drafted document
    const draft = await this.prisma.draftedDocument.create({
      data: {
        userId,
        templateId,
        title: title || template.name,
        description,
        variables,
        generatedContent,
        status: 'DRAFT',
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    });

    return draft;
  }

  /**
   * Get all drafted documents for user
   */
  async getMyDrafts(userId: string, filters?: { status?: string }) {
    const where: any = { userId };

    if (filters?.status) {
      where.status = filters.status;
    }

    const drafts = await this.prisma.draftedDocument.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    });

    return drafts;
  }

  /**
   * Get a specific draft
   */
  async getDraft(id: string, userId: string) {
    const draft = await this.prisma.draftedDocument.findUnique({
      where: { id },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
            variables: true,
          },
        },
      },
    });

    if (!draft) {
      throw new NotFoundException('Draft not found');
    }

    // Verify ownership
    if (draft.userId !== userId) {
      throw new NotFoundException('Draft not found');
    }

    return draft;
  }

  /**
   * Update draft content
   */
  async updateDraft(
    id: string,
    userId: string,
    updates: {
      title?: string;
      description?: string;
      generatedContent?: string;
      status?: 'DRAFT' | 'REVIEWING' | 'FINALIZED';
    },
  ) {
    const draft = await this.getDraft(id, userId);

    const updated = await this.prisma.draftedDocument.update({
      where: { id },
      data: updates,
    });

    return updated;
  }

  /**
   * Regenerate draft content with AI (for prompt-based drafts)
   */
  async regenerateDraft(id: string, userId: string, newPrompt?: string) {
    const draft = await this.getDraft(id, userId);

    if (draft.templateId) {
      throw new Error('Cannot regenerate template-based drafts. Create a new one instead.');
    }

    const promptToUse = newPrompt || draft.userPrompt;
    const generatedContent = await this.generateFromPrompt(promptToUse);

    const updated = await this.prisma.draftedDocument.update({
      where: { id },
      data: {
        userPrompt: promptToUse,
        generatedContent,
        tokensUsed: 3500,
      },
    });

    return updated;
  }

  /**
   * Delete a draft
   */
  async deleteDraft(id: string, userId: string) {
    await this.getDraft(id, userId); // Verify ownership

    await this.prisma.draftedDocument.delete({
      where: { id },
    });

    return { success: true, message: 'Draft deleted successfully' };
  }

  /**
   * Save draft to document workspace
   * TODO: Integrate with documents module
   */
  async saveDraftToWorkspace(id: string, userId: string, projectId: string) {
    const draft = await this.getDraft(id, userId);

    // TODO: Create document in workspace
    // const document = await this.documentsService.create(...);

    // Update draft to mark it as saved
    await this.prisma.draftedDocument.update({
      where: { id },
      data: {
        projectId,
        status: 'FINALIZED',
      },
    });

    return { success: true, message: 'Draft saved to workspace' };
  }

  /**
   * Generate document content from user prompt using AI
   * TODO: Replace with real AI API integration
   */
  private async generateFromPrompt(userPrompt: string): Promise<string> {
    // TODO: In production, call OpenAI/Claude API
    // Example:
    // const response = await openai.chat.completions.create({
    //   model: 'gpt-4',
    //   messages: [
    //     { role: 'system', content: 'You are a legal document drafter...' },
    //     { role: 'user', content: userPrompt }
    //   ]
    // });
    // return response.choices[0].message.content;

    // Mock generated content
    return `
# MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of [DATE], by and between:

**Party A:** [COMPANY A NAME]
Address: [ADDRESS]

**Party B:** [COMPANY B NAME]
Address: [ADDRESS]

(Each a "Party" and collectively the "Parties")

## 1. PURPOSE

The Parties wish to explore a potential business partnership and will need to exchange certain confidential and proprietary information for evaluation purposes.

## 2. DEFINITION OF CONFIDENTIAL INFORMATION

"Confidential Information" means all information disclosed by either Party to the other Party, whether orally, in writing, or in any other form, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and the circumstances of disclosure.

## 3. OBLIGATIONS

Each Party agrees to:

a) Hold and maintain the Confidential Information in strict confidence;
b) Not disclose the Confidential Information to third parties without prior written consent;
c) Only use the Confidential Information for the purpose stated above;
d) Protect the Confidential Information with the same degree of care used to protect its own confidential information.

## 4. TERM

This Agreement shall remain in effect for a period of two (2) years from the date of execution.

## 5. RETURN OF MATERIALS

Upon request or termination of this Agreement, each Party shall return or destroy all Confidential Information received from the other Party.

## 6. GOVERNING LAW

This Agreement shall be governed by and construed in accordance with the laws of Germany.

## 7. SIGNATURES

**Party A:**

Name: _________________________
Title: _________________________
Date: _________________________
Signature: _____________________

**Party B:**

Name: _________________________
Title: _________________________
Date: _________________________
Signature: _____________________
    `.trim();
  }
}
