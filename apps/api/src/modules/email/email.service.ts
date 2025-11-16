import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  emailType: string;
  userId: string;
  variables?: Record<string, any>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Send email (mock implementation - ready for real provider)
   * TODO: Integrate with SendGrid, AWS SES, or other email provider
   */
  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    const { to, subject, html, text, emailType, userId, variables } = options;

    try {
      // Check user preferences
      const canSend = await this.checkUserPreferences(userId, emailType as any);
      if (!canSend) {
        this.logger.log(`Email blocked by user preferences: ${emailType} to ${to}`);
        return false;
      }

      // Log email
      const emailLog = await this.prisma.emailLog.create({
        data: {
          userId,
          emailType: emailType as any,
          recipientEmail: to,
          subject,
          variables: variables || {},
          status: 'PENDING',
        },
      });

      // TODO: Replace with actual email provider
      // Example with SendGrid:
      // await sendgrid.send({ to, subject, html, text });
      // Example with AWS SES:
      // await ses.sendEmail({ ... });

      // Mock: Simulate email sent
      this.logger.log(`Email sent: ${emailType} to ${to}`);

      // Update log to SENT
      await this.prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          provider: 'mock',
        },
      });

      return true;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);

      // Log error
      try {
        await this.prisma.emailLog.create({
          data: {
            userId,
            emailType: emailType as any,
            recipientEmail: to,
            subject,
            status: 'FAILED',
            errorMessage: error.message,
          },
        });
      } catch (logError) {
        this.logger.error(`Failed to log email error: ${logError.message}`);
      }

      return false;
    }
  }

  /**
   * Check if user allows this type of email
   */
  private async checkUserPreferences(userId: string, emailType: string): Promise<boolean> {
    const preferences = await this.prisma.emailPreferences.findUnique({
      where: { userId },
    });

    // If no preferences, create default (all enabled except marketing)
    if (!preferences) {
      await this.prisma.emailPreferences.create({
        data: { userId },
      });
      return !emailType.includes('MARKETING');
    }

    // Map email types to preference fields
    const preferenceMap: Record<string, keyof typeof preferences> = {
      ORDER: 'orderUpdates',
      QUESTION: 'questionAnswers',
      ANSWER: 'questionAnswers',
      MESSAGE: 'newMessages',
      MEETING: 'meetingReminders',
      SUBSCRIPTION: 'subscriptionUpdates',
      MARKETING: 'marketingEmails',
      WEEKLY_DIGEST: 'weeklyDigest',
      ADVISOR_APPLICATION: 'advisorApplications',
    };

    // Find matching preference
    for (const [key, field] of Object.entries(preferenceMap)) {
      if (emailType.includes(key)) {
        return preferences[field] as boolean;
      }
    }

    // Default: allow platform notifications
    return preferences.platformNotifications;
  }

  /**
   * Get user email preferences
   */
  async getPreferences(userId: string) {
    let preferences = await this.prisma.emailPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      preferences = await this.prisma.emailPreferences.create({
        data: { userId },
      });
    }

    return preferences;
  }

  /**
   * Update user email preferences
   */
  async updatePreferences(userId: string, updates: Partial<any>) {
    const preferences = await this.prisma.emailPreferences.upsert({
      where: { userId },
      create: { userId, ...updates },
      update: updates,
    });

    return preferences;
  }

  /**
   * Get email logs for user
   */
  async getEmailLogs(userId: string, limit = 50) {
    return this.prisma.emailLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // ===== Email Templates =====

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(userId: string, email: string, name: string) {
    return this.sendEmail({
      to: email,
      subject: 'Welcome to FitMeLegal!',
      html: this.getWelcomeEmailHtml(name),
      emailType: 'WELCOME',
      userId,
      variables: { name },
    });
  }

  /**
   * Send order confirmation
   */
  async sendOrderConfirmation(userId: string, email: string, orderDetails: any) {
    return this.sendEmail({
      to: email,
      subject: `Order Confirmation #${orderDetails.id}`,
      html: this.getOrderConfirmationHtml(orderDetails),
      emailType: 'ORDER_CONFIRMED',
      userId,
      variables: orderDetails,
    });
  }

  /**
   * Send meeting reminder
   */
  async sendMeetingReminder(userId: string, email: string, meetingDetails: any) {
    return this.sendEmail({
      to: email,
      subject: `Meeting Reminder: ${meetingDetails.title}`,
      html: this.getMeetingReminderHtml(meetingDetails),
      emailType: 'MEETING_REMINDER',
      userId,
      variables: meetingDetails,
    });
  }

  // ===== HTML Templates =====

  private getWelcomeEmailHtml(name: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to FitMeLegal!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Thank you for joining FitMeLegal, your trusted platform for legal and tax advice!</p>
            <p>We're excited to have you on board. Here's what you can do:</p>
            <ul>
              <li>Ask questions to verified advisors</li>
              <li>Book fixed-price services</li>
              <li>Schedule video consultations</li>
              <li>Access AI-powered document tools</li>
            </ul>
            <p style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:3000" class="button">Get Started</a>
            </p>
          </div>
          <div class="footer">
            <p>© 2025 FitMeLegal. All rights reserved.</p>
            <p>You're receiving this email because you created an account.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getOrderConfirmationHtml(orderDetails: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Order Confirmation</h2>
          <p>Your order has been confirmed!</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Order ID:</strong> ${orderDetails.id}</p>
            <p><strong>Service:</strong> ${orderDetails.serviceName || 'Professional Service'}</p>
            <p><strong>Amount:</strong> €${orderDetails.price}</p>
            <p><strong>Status:</strong> ${orderDetails.status}</p>
          </div>
          <p>We'll notify you when your order is in progress.</p>
          <p>Thank you for choosing FitMeLegal!</p>
        </div>
      </body>
      </html>
    `;
  }

  private getMeetingReminderHtml(meetingDetails: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Meeting Reminder</h2>
          <p>Your meeting is scheduled for ${meetingDetails.scheduledStart}.</p>
          <div style="background: #eff6ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Title:</strong> ${meetingDetails.title}</p>
            <p><strong>Time:</strong> ${meetingDetails.scheduledStart}</p>
            <p><strong>Duration:</strong> ${meetingDetails.duration || '60 minutes'}</p>
          </div>
          <p style="text-align: center;">
            <a href="${meetingDetails.roomUrl || '#'}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px;">
              Join Meeting
            </a>
          </p>
        </div>
      </body>
      </html>
    `;
  }
}
