# PROJECT STRUCTURE GUIDE
## Legal + Tax Marketplace Platform

---

## 📁 RECOMMENDED FOLDER STRUCTURE

```
FitMeLegal/
├── apps/
│   ├── api/                          # Backend API (NestJS)
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   ├── auth.module.ts
│   │   │   │   │   ├── dto/
│   │   │   │   │   │   ├── login.dto.ts
│   │   │   │   │   │   ├── register.dto.ts
│   │   │   │   │   │   └── refresh-token.dto.ts
│   │   │   │   │   ├── guards/
│   │   │   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   │   │   └── roles.guard.ts
│   │   │   │   │   ├── strategies/
│   │   │   │   │   │   ├── jwt.strategy.ts
│   │   │   │   │   │   ├── google.strategy.ts
│   │   │   │   │   │   └── local.strategy.ts
│   │   │   │   │   └── decorators/
│   │   │   │   │       └── current-user.decorator.ts
│   │   │   │   ├── users/
│   │   │   │   │   ├── users.controller.ts
│   │   │   │   │   ├── users.service.ts
│   │   │   │   │   ├── users.module.ts
│   │   │   │   │   ├── dto/
│   │   │   │   │   └── entities/
│   │   │   │   ├── advisors/
│   │   │   │   │   ├── advisors.controller.ts
│   │   │   │   │   ├── advisors.service.ts
│   │   │   │   │   ├── advisors.module.ts
│   │   │   │   │   ├── dto/
│   │   │   │   │   └── entities/
│   │   │   │   ├── questions/
│   │   │   │   │   ├── questions.controller.ts
│   │   │   │   │   ├── questions.service.ts
│   │   │   │   │   ├── questions.module.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── answers/
│   │   │   │   ├── services/          # Fixed-price services
│   │   │   │   ├── orders/
│   │   │   │   ├── subscriptions/
│   │   │   │   ├── payments/
│   │   │   │   │   ├── payments.controller.ts
│   │   │   │   │   ├── payments.service.ts
│   │   │   │   │   ├── payments.module.ts
│   │   │   │   │   ├── stripe/
│   │   │   │   │   │   ├── stripe.service.ts
│   │   │   │   │   │   └── stripe-webhook.controller.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── video-meetings/
│   │   │   │   │   ├── video-meetings.controller.ts
│   │   │   │   │   ├── video-meetings.service.ts
│   │   │   │   │   ├── providers/
│   │   │   │   │   │   ├── daily.service.ts
│   │   │   │   │   │   └── agora.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── documents/
│   │   │   │   │   ├── documents.controller.ts
│   │   │   │   │   ├── documents.service.ts
│   │   │   │   │   ├── storage/
│   │   │   │   │   │   └── s3.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── messaging/
│   │   │   │   │   ├── messaging.gateway.ts
│   │   │   │   │   ├── messaging.service.ts
│   │   │   │   │   ├── messaging.controller.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── notifications/
│   │   │   │   │   ├── notifications.service.ts
│   │   │   │   │   ├── providers/
│   │   │   │   │   │   ├── email.service.ts
│   │   │   │   │   │   ├── sms.service.ts
│   │   │   │   │   │   └── push.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── ai/
│   │   │   │   │   ├── ai.controller.ts
│   │   │   │   │   ├── ai.service.ts
│   │   │   │   │   ├── providers/
│   │   │   │   │   │   ├── openai.service.ts
│   │   │   │   │   │   ├── claude.service.ts
│   │   │   │   │   │   ├── deepl.service.ts
│   │   │   │   │   │   └── textract.service.ts
│   │   │   │   │   ├── prompts/
│   │   │   │   │   │   ├── contract-analysis.ts
│   │   │   │   │   │   ├── document-drafting.ts
│   │   │   │   │   │   └── translation.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── admin/
│   │   │   │   │   ├── admin.controller.ts
│   │   │   │   │   ├── admin.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── search/
│   │   │   │   │   ├── search.service.ts
│   │   │   │   │   └── elasticsearch.service.ts
│   │   │   │   └── analytics/
│   │   │   │       ├── analytics.service.ts
│   │   │   │       └── analytics.controller.ts
│   │   │   ├── common/
│   │   │   │   ├── decorators/
│   │   │   │   ├── filters/
│   │   │   │   │   └── http-exception.filter.ts
│   │   │   │   ├── interceptors/
│   │   │   │   │   ├── logging.interceptor.ts
│   │   │   │   │   └── transform.interceptor.ts
│   │   │   │   ├── pipes/
│   │   │   │   │   └── validation.pipe.ts
│   │   │   │   ├── middleware/
│   │   │   │   │   └── logger.middleware.ts
│   │   │   │   └── utils/
│   │   │   │       ├── encryption.util.ts
│   │   │   │       ├── validation.util.ts
│   │   │   │       └── date.util.ts
│   │   │   ├── config/
│   │   │   │   ├── app.config.ts
│   │   │   │   ├── database.config.ts
│   │   │   │   ├── jwt.config.ts
│   │   │   │   └── stripe.config.ts
│   │   │   ├── prisma/
│   │   │   │   ├── schema.prisma
│   │   │   │   ├── migrations/
│   │   │   │   └── seed.ts
│   │   │   ├── main.ts
│   │   │   └── app.module.ts
│   │   ├── test/
│   │   │   ├── unit/
│   │   │   └── e2e/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── nest-cli.json
│   │
│   ├── web/                          # Frontend Web App (Next.js)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/
│   │   │   │   │   ├── login/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── register/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── forgot-password/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── layout.tsx
│   │   │   │   ├── (marketing)/
│   │   │   │   │   ├── page.tsx               # Homepage
│   │   │   │   │   ├── about/
│   │   │   │   │   ├── pricing/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── how-it-works/
│   │   │   │   │   └── layout.tsx
│   │   │   │   ├── (dashboard)/
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── questions/
│   │   │   │   │   │   ├── page.tsx           # My questions
│   │   │   │   │   │   ├── new/
│   │   │   │   │   │   │   └── page.tsx       # Post question
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       └── page.tsx       # Question detail
│   │   │   │   │   ├── services/
│   │   │   │   │   │   ├── page.tsx           # My services
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   ├── orders/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   ├── meetings/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── schedule/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       ├── page.tsx
│   │   │   │   │   │       └── room/
│   │   │   │   │   │           └── page.tsx   # Video call
│   │   │   │   │   ├── messages/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── documents/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       └── page.tsx       # Document viewer
│   │   │   │   │   ├── profile/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── settings/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── subscription/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── layout.tsx
│   │   │   │   ├── (marketplace)/
│   │   │   │   │   ├── explore/
│   │   │   │   │   │   ├── questions/
│   │   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   │   └── [id]/
│   │   │   │   │   │   │       └── page.tsx
│   │   │   │   │   │   ├── services/
│   │   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   │   └── [id]/
│   │   │   │   │   │   │       └── page.tsx
│   │   │   │   │   │   └── advisors/
│   │   │   │   │   │       ├── page.tsx
│   │   │   │   │   │       └── [id]/
│   │   │   │   │   │           └── page.tsx
│   │   │   │   │   └── layout.tsx
│   │   │   │   ├── (advisor)/
│   │   │   │   │   ├── advisor/
│   │   │   │   │   │   ├── dashboard/
│   │   │   │   │   │   ├── my-services/
│   │   │   │   │   │   ├── earnings/
│   │   │   │   │   │   └── analytics/
│   │   │   │   │   └── layout.tsx
│   │   │   │   ├── api/
│   │   │   │   │   ├── auth/
│   │   │   │   │   │   └── [...nextauth]/
│   │   │   │   │   │       └── route.ts
│   │   │   │   │   └── webhooks/
│   │   │   │   │       └── stripe/
│   │   │   │   │           └── route.ts
│   │   │   │   ├── layout.tsx
│   │   │   │   └── globals.css
│   │   │   ├── components/
│   │   │   │   ├── ui/                        # shadcn components
│   │   │   │   │   ├── button.tsx
│   │   │   │   │   ├── input.tsx
│   │   │   │   │   ├── dialog.tsx
│   │   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   │   ├── card.tsx
│   │   │   │   │   ├── avatar.tsx
│   │   │   │   │   ├── badge.tsx
│   │   │   │   │   └── ...
│   │   │   │   ├── layout/
│   │   │   │   │   ├── header.tsx
│   │   │   │   │   ├── footer.tsx
│   │   │   │   │   ├── sidebar.tsx
│   │   │   │   │   └── navigation.tsx
│   │   │   │   ├── auth/
│   │   │   │   │   ├── login-form.tsx
│   │   │   │   │   ├── register-form.tsx
│   │   │   │   │   └── oauth-buttons.tsx
│   │   │   │   ├── questions/
│   │   │   │   │   ├── question-card.tsx
│   │   │   │   │   ├── question-form.tsx
│   │   │   │   │   ├── question-filters.tsx
│   │   │   │   │   └── answer-form.tsx
│   │   │   │   ├── advisors/
│   │   │   │   │   ├── advisor-card.tsx
│   │   │   │   │   ├── advisor-profile.tsx
│   │   │   │   │   └── advisor-filters.tsx
│   │   │   │   ├── services/
│   │   │   │   │   ├── service-card.tsx
│   │   │   │   │   ├── service-form.tsx
│   │   │   │   │   └── booking-flow.tsx
│   │   │   │   ├── payments/
│   │   │   │   │   ├── payment-modal.tsx
│   │   │   │   │   ├── stripe-elements.tsx
│   │   │   │   │   └── invoice.tsx
│   │   │   │   ├── video/
│   │   │   │   │   ├── video-room.tsx
│   │   │   │   │   ├── meeting-scheduler.tsx
│   │   │   │   │   └── video-controls.tsx
│   │   │   │   ├── messaging/
│   │   │   │   │   ├── chat-interface.tsx
│   │   │   │   │   ├── message-list.tsx
│   │   │   │   │   ├── message-input.tsx
│   │   │   │   │   └── channel-list.tsx
│   │   │   │   ├── documents/
│   │   │   │   │   ├── document-viewer.tsx
│   │   │   │   │   ├── pdf-viewer.tsx
│   │   │   │   │   ├── annotation-tools.tsx
│   │   │   │   │   └── file-uploader.tsx
│   │   │   │   └── common/
│   │   │   │       ├── loading-spinner.tsx
│   │   │   │       ├── error-boundary.tsx
│   │   │   │       ├── empty-state.tsx
│   │   │   │       └── pagination.tsx
│   │   │   ├── lib/
│   │   │   │   ├── api/
│   │   │   │   │   ├── client.ts             # Axios instance
│   │   │   │   │   ├── endpoints/
│   │   │   │   │   │   ├── auth.ts
│   │   │   │   │   │   ├── questions.ts
│   │   │   │   │   │   ├── advisors.ts
│   │   │   │   │   │   ├── payments.ts
│   │   │   │   │   │   └── ...
│   │   │   │   │   └── types.ts
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── use-auth.ts
│   │   │   │   │   ├── use-questions.ts
│   │   │   │   │   ├── use-advisors.ts
│   │   │   │   │   ├── use-payments.ts
│   │   │   │   │   ├── use-socket.ts
│   │   │   │   │   └── use-debounce.ts
│   │   │   │   ├── store/
│   │   │   │   │   ├── auth-store.ts
│   │   │   │   │   ├── ui-store.ts
│   │   │   │   │   └── messages-store.ts
│   │   │   │   ├── utils/
│   │   │   │   │   ├── format.ts
│   │   │   │   │   ├── validation.ts
│   │   │   │   │   ├── date.ts
│   │   │   │   │   └── constants.ts
│   │   │   │   └── providers/
│   │   │   │       ├── auth-provider.tsx
│   │   │   │       ├── theme-provider.tsx
│   │   │   │       └── query-provider.tsx
│   │   │   ├── types/
│   │   │   │   ├── user.ts
│   │   │   │   ├── advisor.ts
│   │   │   │   ├── question.ts
│   │   │   │   ├── service.ts
│   │   │   │   └── payment.ts
│   │   │   └── middleware.ts
│   │   ├── public/
│   │   │   ├── images/
│   │   │   ├── icons/
│   │   │   └── fonts/
│   │   ├── messages/                          # i18n translations
│   │   │   ├── en.json
│   │   │   ├── de.json
│   │   │   ├── fr.json
│   │   │   └── ...
│   │   ├── .env.local
│   │   ├── .env.example
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── admin/                        # Admin Dashboard (Next.js)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (dashboard)/
│   │   │   │   │   ├── page.tsx              # Admin home
│   │   │   │   │   ├── users/
│   │   │   │   │   ├── advisors/
│   │   │   │   │   │   └── verification/
│   │   │   │   │   ├── payments/
│   │   │   │   │   ├── disputes/
│   │   │   │   │   ├── analytics/
│   │   │   │   │   └── settings/
│   │   │   │   └── layout.tsx
│   │   │   └── components/
│   │   └── package.json
│   │
│   └── mobile/                       # Mobile App (React Native)
│       ├── src/
│       │   ├── screens/
│       │   │   ├── auth/
│       │   │   ├── home/
│       │   │   ├── questions/
│       │   │   ├── messages/
│       │   │   ├── profile/
│       │   │   └── ...
│       │   ├── components/
│       │   ├── navigation/
│       │   ├── services/
│       │   ├── hooks/
│       │   └── utils/
│       ├── android/
│       ├── ios/
│       ├── app.json
│       └── package.json
│
├── packages/
│   ├── shared/                       # Shared code between apps
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── user.ts
│   │   │   │   ├── advisor.ts
│   │   │   │   ├── question.ts
│   │   │   │   └── ...
│   │   │   ├── constants/
│   │   │   │   ├── categories.ts
│   │   │   │   ├── roles.ts
│   │   │   │   └── permissions.ts
│   │   │   ├── utils/
│   │   │   │   ├── validation.ts
│   │   │   │   ├── format.ts
│   │   │   │   └── ...
│   │   │   └── schemas/
│   │   │       ├── user.schema.ts
│   │   │       ├── question.schema.ts
│   │   │       └── ...
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── ui/                           # Shared UI components
│       ├── src/
│       │   ├── button/
│       │   ├── input/
│       │   ├── card/
│       │   └── ...
│       └── package.json
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── deploy-api.yml
│   │   ├── deploy-web.yml
│   │   └── test.yml
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
│
├── docs/
│   ├── PRODUCT_BLUEPRINT.md
│   ├── TECHNICAL_ARCHITECTURE.md
│   ├── IMPLEMENTATION_ROADMAP.md
│   ├── API_DOCUMENTATION.md
│   ├── DEPLOYMENT_GUIDE.md
│   └── CONTRIBUTING.md
│
├── scripts/
│   ├── seed-database.ts
│   ├── migrate-data.ts
│   └── generate-fixtures.ts
│
├── docker-compose.yml                # Local development
├── .gitignore
├── .env.example
├── README.md
├── LICENSE
└── package.json                      # Root package.json (monorepo)
```

---

## 🔧 TECHNOLOGY SETUP

### Monorepo Management

**Option 1: Turborepo (Recommended)**

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false
    }
  }
}
```

**Option 2: Nx**

```json
// nx.json
{
  "npmScope": "fitmelegal",
  "affected": {
    "defaultBase": "main"
  },
  "tasksRunnerOptions": {
    "default": {
      "runner": "@nrwl/workspace/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "lint", "test"]
      }
    }
  }
}
```

---

### Backend Setup (NestJS)

**main.ts**
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose']
  });

  // Security
  app.use(helmet());
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true
  });

  // Compression
  app.use(compression());

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Legal + Tax Marketplace API')
    .setDescription('API for FitMeLegal platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Start server
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}`);
  console.log(`📚 API Docs: http://localhost:${port}/api/docs`);
}

bootstrap();
```

**app.module.ts**
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AdvisorsModule } from './modules/advisors/advisors.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { AnswersModule } from './modules/answers/answers.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { VideoMeetingsModule } from './modules/video-meetings/video-meetings.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { AiModule } from './modules/ai/ai.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    AdvisorsModule,
    QuestionsModule,
    AnswersModule,
    PaymentsModule,
    MessagingModule,
    VideoMeetingsModule,
    DocumentsModule,
    AiModule,
    NotificationsModule,
    AdminModule
  ]
})
export class AppModule {}
```

---

### Frontend Setup (Next.js)

**next.config.js**
```javascript
/** @type {import('next').NextConfig} */
const withNextIntl = require('next-intl/plugin')();

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'localhost',
      'fitmelegal-prod.s3.eu-central-1.amazonaws.com',
      'res.cloudinary.com'
    ]
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  },
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil'
    });
    return config;
  }
};

module.exports = withNextIntl(nextConfig);
```

**tailwind.config.ts**
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a'
        },
        secondary: {
          500: '#f59e0b',
          600: '#d97706'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Fira Mono', 'monospace']
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
};

export default config;
```

---

### Database Setup (Prisma)

**schema.prisma**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String    @map("password_hash")
  role          UserRole
  userType      UserType? @map("user_type")
  firstName     String    @map("first_name")
  lastName      String    @map("last_name")
  phone         String?
  language      String    @default("en")
  timezone      String    @default("UTC")
  avatarUrl     String?   @map("avatar_url")
  emailVerified Boolean   @default(false) @map("email_verified")
  phoneVerified Boolean   @default(false) @map("phone_verified")
  kycStatus     KycStatus @default(PENDING) @map("kyc_status")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  deletedAt     DateTime? @map("deleted_at")

  advisor       Advisor?
  questions     Question[]
  answers       Answer[]
  reviews       Review[]
  // ... other relations

  @@map("users")
}

enum UserRole {
  CLIENT
  ADVISOR
  ADMIN
}

enum UserType {
  PRIVATE
  FREELANCER
  SME
  CORPORATE
}

enum KycStatus {
  PENDING
  VERIFIED
  REJECTED
}

// ... other models
```

---

### Environment Variables

**.env.example**
```bash
# App
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/fitmelegal_dev?schema=public

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRES_IN=30d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=fitmelegal-dev-files
AWS_REGION=eu-central-1

# Video (Daily.co)
DAILY_API_KEY=your-daily-api-key

# AI
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DEEPL_API_KEY=your-deepl-key

# Email
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@fitmelegal.com

# SMS
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
APPLE_CLIENT_ID=...
APPLE_CLIENT_SECRET=...

# Monitoring
SENTRY_DSN=https://...
POSTHOG_API_KEY=phc_...
```

---

## 🚀 GETTING STARTED

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Docker (optional, for local dev)

### Setup Instructions

```bash
# 1. Clone repository
git clone https://github.com/your-org/FitMeLegal.git
cd FitMeLegal

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env
# Edit .env with your values

# 4. Start databases (Docker)
docker-compose up -d postgres redis

# 5. Run database migrations
cd apps/api
npx prisma migrate dev
npx prisma db seed

# 6. Start development servers
cd ../..
npm run dev

# This starts:
# - API: http://localhost:3001
# - Web: http://localhost:3000
# - Admin: http://localhost:3002
```

---

**END OF PROJECT STRUCTURE**
