# TECHNICAL ARCHITECTURE
## Legal + Tax Marketplace Platform

---

## 🏛️ SYSTEM ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
├──────────────┬──────────────┬──────────────┬────────────────┤
│   Web App    │  Mobile iOS  │ Mobile Android│   Admin Panel │
│  (Next.js)   │   (React N)  │   (React N)  │   (Next.js)   │
└──────┬───────┴──────┬───────┴──────┬───────┴──────┬─────────┘
       │              │              │              │
       └──────────────┴──────────────┴──────────────┘
                      │
       ┌──────────────┴──────────────┐
       │        CDN / WAF            │
       │      (Cloudflare)           │
       └──────────────┬──────────────┘
                      │
       ┌──────────────┴──────────────┐
       │     Load Balancer           │
       └──────────────┬──────────────┘
                      │
       ┌──────────────┴──────────────────────────────┐
       │           API GATEWAY                       │
       │  (Rate Limiting, Auth, Routing)            │
       └──────────────┬──────────────────────────────┘
                      │
       ┌──────────────┴──────────────┐
       │                             │
   ┌───▼────┐                  ┌────▼─────┐
   │  REST  │                  │ GraphQL  │
   │  API   │                  │   API    │
   └───┬────┘                  └────┬─────┘
       │                            │
       └────────────┬───────────────┘
                    │
       ┌────────────┴────────────────────────────────┐
       │         APPLICATION LAYER (Nest.js)        │
       ├─────────┬─────────┬──────────┬─────────────┤
       │  Auth   │  Users  │Marketplace│  Payments  │
       │ Service │ Service │  Service  │  Service   │
       ├─────────┼─────────┼──────────┼─────────────┤
       │  Video  │   AI    │Documents │ Messaging  │
       │ Service │ Service │  Service │  Service   │
       └─────────┴─────────┴──────────┴─────────────┘
                    │
       ┌────────────┴────────────────────────────────┐
       │                                             │
   ┌───▼─────┐  ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
   │PostgreSQL│  │  Redis  │  │  S3     │  │External │
   │(Primary) │  │(Cache/  │  │(Files)  │  │Services │
   │          │  │ Queue)  │  │         │  │         │
   └──────────┘  └─────────┘  └─────────┘  └─────────┘
                                                │
                               ┌────────────────┴─────────────┐
                               │                              │
                          ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
                          │ Stripe  │  │Daily.co │  │ OpenAI  │
                          │(Payment)│  │(Video)  │  │(AI/LLM) │
                          └─────────┘  └─────────┘  └─────────┘
```

---

## 📦 MICROSERVICES ARCHITECTURE

### Core Services

#### 1. **Authentication Service**
- User registration/login
- JWT token generation
- OAuth integration
- MFA management
- Session management
- Password reset

**Tech Stack:**
- Node.js + Nest.js
- Passport.js
- JWT
- bcrypt

**Database:**
- PostgreSQL (users, sessions)
- Redis (token blacklist, rate limiting)

---

#### 2. **User Service**
- User profile management
- Role management
- Preferences
- KYC/verification
- Avatar upload

**Tech Stack:**
- Node.js + Nest.js
- Prisma ORM
- Sharp (image processing)

**Database:**
- PostgreSQL (user profiles)
- S3 (avatars, documents)

---

#### 3. **Marketplace Service**
- Questions (CRUD)
- Answers (CRUD)
- Services (CRUD)
- Orders (CRUD)
- Matching algorithm
- Search & filtering

**Tech Stack:**
- Node.js + Nest.js
- Elasticsearch (search)
- BullMQ (job processing)

**Database:**
- PostgreSQL (questions, answers, services, orders)
- Elasticsearch (full-text search)
- Redis (cache, queue)

---

#### 4. **Payment Service**
- Payment processing
- Escrow management
- Subscription billing
- Payout processing
- Invoice generation
- Refunds

**Tech Stack:**
- Node.js + Nest.js
- Stripe SDK
- PDFKit (invoices)

**Database:**
- PostgreSQL (payments, subscriptions)
- Stripe (payment intents, subscriptions)

---

#### 5. **Video Service**
- Meeting scheduling
- Video room management
- Recording management
- Transcription
- Subtitles/translation

**Tech Stack:**
- Node.js + Nest.js
- Daily.co API (or Agora)
- Whisper API (transcription)

**Database:**
- PostgreSQL (meetings)
- S3 (recordings, transcripts)

---

#### 6. **AI Service**
- Contract analysis
- Document drafting
- Tax form recognition
- Translation
- Chatbot
- Summarization

**Tech Stack:**
- Python + FastAPI (or Node.js)
- OpenAI API (GPT-4)
- Anthropic API (Claude)
- DeepL API (translation)
- AWS Textract (OCR)

**Database:**
- PostgreSQL (analysis results)
- Pinecone (vector DB for embeddings)
- Redis (cache)

---

#### 7. **Document Service**
- File upload/download
- Version control
- Annotations
- E-signature
- Translation
- OCR processing

**Tech Stack:**
- Node.js + Nest.js
- AWS S3
- Sharp (image processing)
- pdf-lib (PDF manipulation)

**Database:**
- PostgreSQL (document metadata)
- S3 (actual files)

---

#### 8. **Messaging Service**
- Real-time chat
- Channels (direct, group)
- Message encryption
- File sharing
- Notifications

**Tech Stack:**
- Node.js + Nest.js
- Socket.io or Pusher
- Encryption libraries

**Database:**
- PostgreSQL (messages)
- Redis (online status, typing indicators)

---

#### 9. **Notification Service**
- Email notifications
- SMS notifications
- Push notifications
- In-app notifications
- Notification preferences

**Tech Stack:**
- Node.js + Nest.js
- Resend/SendGrid (email)
- Twilio (SMS)
- Firebase Cloud Messaging (push)
- BullMQ (job queue)

**Database:**
- PostgreSQL (notification logs)
- Redis (queue)

---

#### 10. **Admin Service**
- User management
- Advisor verification
- Dispute resolution
- Analytics
- Content management

**Tech Stack:**
- Node.js + Nest.js
- Next.js (admin UI)

**Database:**
- PostgreSQL (all data access)
- Redis (cache)

---

## 🗄️ DATABASE DESIGN

### Primary Database: PostgreSQL

#### Schema Organization
- **Schema: public** - Core tables (users, advisors, questions, etc.)
- **Schema: payments** - Payment-related tables
- **Schema: analytics** - Analytics and reporting tables
- **Schema: audit** - Audit logs

#### Key Tables (Detailed)

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('client', 'advisor', 'admin')),
  user_type VARCHAR(50) CHECK (user_type IN ('private', 'freelancer', 'sme', 'corporate')),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(50),
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(100) DEFAULT 'UTC',
  avatar_url TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  kyc_status VARCHAR(50) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Advisors table
CREATE TABLE advisors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  advisor_type VARCHAR(50) NOT NULL CHECK (advisor_type IN ('lawyer', 'tax_advisor', 'dual')),
  specializations JSONB NOT NULL DEFAULT '[]',
  languages JSONB NOT NULL DEFAULT '[]',
  license_number VARCHAR(100),
  bar_association VARCHAR(255),
  years_experience INT,
  bio TEXT,
  hourly_rate DECIMAL(10, 2),
  verification_level VARCHAR(50) DEFAULT 'basic' CHECK (verification_level IN ('basic', 'professional', 'enhanced')),
  verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verification_documents JSONB DEFAULT '[]',
  rating DECIMAL(3, 2) DEFAULT 0.0,
  total_reviews INT DEFAULT 0,
  total_earnings DECIMAL(12, 2) DEFAULT 0.0,
  response_time_minutes INT DEFAULT 0,
  acceptance_rate DECIMAL(3, 2) DEFAULT 0.0,
  featured BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX idx_advisors_type ON advisors(advisor_type);
CREATE INDEX idx_advisors_rating ON advisors(rating DESC);
CREATE INDEX idx_advisors_featured ON advisors(featured) WHERE featured = TRUE;

-- Questions table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL CHECK (category IN ('legal', 'tax')),
  subcategory VARCHAR(100) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  language VARCHAR(10) NOT NULL,
  budget DECIMAL(10, 2) NOT NULL,
  urgency VARCHAR(50) DEFAULT 'normal' CHECK (urgency IN ('normal', 'urgent', 'critical')),
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed', 'disputed')),
  selected_answer_id UUID,
  attachments JSONB DEFAULT '[]',
  views INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT positive_budget CHECK (budget > 0)
);

CREATE INDEX idx_questions_user_id ON questions(user_id);
CREATE INDEX idx_questions_category ON questions(category);
CREATE INDEX idx_questions_status ON questions(status);
CREATE INDEX idx_questions_created_at ON questions(created_at DESC);

-- Answers table
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  advisor_id UUID REFERENCES advisors(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT positive_price CHECK (price > 0)
);

CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_answers_advisor_id ON answers(advisor_id);
CREATE INDEX idx_answers_created_at ON answers(created_at DESC);

-- Services table
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID REFERENCES advisors(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL CHECK (category IN ('legal', 'tax')),
  subcategory VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  deliverables JSONB NOT NULL DEFAULT '[]',
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'EUR',
  delivery_days INT NOT NULL,
  revisions INT DEFAULT 1,
  active BOOLEAN DEFAULT TRUE,
  featured BOOLEAN DEFAULT FALSE,
  total_orders INT DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT positive_price CHECK (price > 0),
  CONSTRAINT positive_delivery CHECK (delivery_days > 0)
);

CREATE INDEX idx_services_advisor_id ON services(advisor_id);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_active ON services(active) WHERE active = TRUE;

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  client_id UUID REFERENCES users(id) ON DELETE CASCADE,
  advisor_id UUID REFERENCES advisors(id) ON DELETE CASCADE,
  customization JSONB DEFAULT '{}',
  total_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'delivered', 'completed', 'cancelled', 'disputed')),
  milestones JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  CONSTRAINT positive_total CHECK (total_price > 0)
);

CREATE INDEX idx_orders_client_id ON orders(client_id);
CREATE INDEX idx_orders_advisor_id ON orders(advisor_id);
CREATE INDEX idx_orders_status ON orders(status);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL CHECK (plan IN ('basic', 'professional', 'business', 'enterprise')),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
  billing_cycle VARCHAR(50) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'EUR',
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  stripe_subscription_id VARCHAR(255),
  usage JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Video Meetings table
CREATE TABLE video_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID REFERENCES users(id) ON DELETE CASCADE,
  participants JSONB NOT NULL DEFAULT '[]',
  title VARCHAR(255) NOT NULL,
  scheduled_at TIMESTAMP NOT NULL,
  duration_minutes INT NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  recording_url TEXT,
  transcript_url TEXT,
  summary_url TEXT,
  provider VARCHAR(50) NOT NULL,
  room_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_meetings_host_id ON video_meetings(host_id);
CREATE INDEX idx_meetings_scheduled_at ON video_meetings(scheduled_at);

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT NOT NULL,
  storage_url TEXT NOT NULL,
  version INT DEFAULT 1,
  parent_version_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  language VARCHAR(10),
  ai_analysis JSONB,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'signed')),
  signatures JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_project_id ON documents(project_id);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  project_type VARCHAR(50) CHECK (project_type IN ('legal', 'tax', 'mixed')),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  members JSONB DEFAULT '[]',
  advisors JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL, -- encrypted
  message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'voice', 'system')),
  attachments JSONB DEFAULT '[]',
  reply_to UUID REFERENCES messages(id) ON DELETE SET NULL,
  read_by JSONB DEFAULT '[]',
  translated_content JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_messages_channel_id ON messages(channel_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Channels table
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_type VARCHAR(50) NOT NULL CHECK (channel_type IN ('direct', 'group', 'project')),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  participants JSONB NOT NULL DEFAULT '[]',
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_channels_type ON channels(channel_type);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  payee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'EUR',
  payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('question', 'service', 'subscription', 'video_call')),
  reference_id UUID NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'held', 'released', 'refunded', 'failed')),
  stripe_payment_id VARCHAR(255),
  platform_fee DECIMAL(10, 2) NOT NULL,
  net_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  released_at TIMESTAMP,
  CONSTRAINT positive_amount CHECK (amount > 0)
);

CREATE INDEX idx_payments_payer_id ON payments(payer_id);
CREATE INDEX idx_payments_payee_id ON payments(payee_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- Reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  advisor_id UUID REFERENCES advisors(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  response TEXT, -- advisor's response
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reviews_advisor_id ON reviews(advisor_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
```

#### Triggers & Functions

```sql
-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_advisors_updated_at BEFORE UPDATE ON advisors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ... (apply to all relevant tables)

-- Update advisor rating on new review
CREATE OR REPLACE FUNCTION update_advisor_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE advisors
    SET rating = (
        SELECT AVG(rating)::DECIMAL(3,2)
        FROM reviews
        WHERE advisor_id = NEW.advisor_id
    ),
    total_reviews = (
        SELECT COUNT(*)
        FROM reviews
        WHERE advisor_id = NEW.advisor_id
    )
    WHERE id = NEW.advisor_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_advisor_rating
AFTER INSERT ON reviews
FOR EACH ROW EXECUTE FUNCTION update_advisor_rating();
```

---

### Redis Structure

#### Cache Keys
```
user:{userId}:profile - User profile data
advisor:{advisorId}:profile - Advisor profile data
question:{questionId} - Question details
service:{serviceId} - Service details
session:{sessionId} - User session data
```

#### Rate Limiting
```
ratelimit:ip:{ipAddress}:{endpoint} - Rate limit per IP
ratelimit:user:{userId}:{endpoint} - Rate limit per user
```

#### Real-time
```
online:{userId} - Online status
typing:{channelId}:{userId} - Typing indicator
```

#### Job Queues (BullMQ)
```
queue:emails - Email sending queue
queue:notifications - Push notifications queue
queue:ai-processing - AI analysis jobs
queue:video-processing - Video recording processing
queue:payments - Payment processing jobs
```

---

## 🔐 SECURITY ARCHITECTURE

### Authentication Flow

```
1. User submits credentials (email + password)
   ↓
2. Server validates credentials
   ↓
3. Generate JWT access token (15min expiry)
   ↓
4. Generate refresh token (30 days, stored in DB)
   ↓
5. Return tokens to client
   ↓
6. Client stores access token in memory
   ↓
7. Client stores refresh token in httpOnly cookie
   ↓
8. Each request includes access token in Authorization header
   ↓
9. When access token expires, use refresh token to get new one
   ↓
10. Refresh token rotation (new refresh token on each use)
```

### Encryption Strategy

#### Data at Rest
- **Database**: PostgreSQL native encryption (pgcrypto)
- **Files**: S3 server-side encryption (SSE-S3 or SSE-KMS)
- **Backups**: Encrypted with separate key

#### Data in Transit
- **TLS 1.3** for all HTTP connections
- **WSS** (WebSocket Secure) for real-time connections

#### End-to-End Encryption (Messages)
```typescript
// Client-side encryption before sending
const encryptMessage = (message: string, recipientPublicKey: string) => {
  const encrypted = encrypt(message, recipientPublicKey);
  return encrypted;
};

// Server stores encrypted message (cannot read it)
// Recipient decrypts with their private key
const decryptMessage = (encryptedMessage: string, privateKey: string) => {
  const decrypted = decrypt(encryptedMessage, privateKey);
  return decrypted;
};
```

### RBAC (Role-Based Access Control)

```typescript
enum Permission {
  // Users
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',

  // Advisors
  ADVISOR_READ = 'advisor:read',
  ADVISOR_WRITE = 'advisor:write',
  ADVISOR_VERIFY = 'advisor:verify',

  // Questions
  QUESTION_READ = 'question:read',
  QUESTION_WRITE = 'question:write',
  QUESTION_DELETE = 'question:delete',

  // Payments
  PAYMENT_READ = 'payment:read',
  PAYMENT_REFUND = 'payment:refund',

  // Admin
  ADMIN_ALL = 'admin:*'
}

const rolePermissions = {
  client: [
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.QUESTION_READ,
    Permission.QUESTION_WRITE,
    Permission.PAYMENT_READ
  ],
  advisor: [
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.ADVISOR_READ,
    Permission.ADVISOR_WRITE,
    Permission.QUESTION_READ,
    Permission.PAYMENT_READ
  ],
  admin: [Permission.ADMIN_ALL]
};
```

---

## 📡 API DESIGN PATTERNS

### RESTful Conventions

```
Resource-based URLs:
✅ GET /api/questions
✅ POST /api/questions
✅ GET /api/questions/:id
✅ PATCH /api/questions/:id
✅ DELETE /api/questions/:id

Action-based (for special operations):
✅ POST /api/questions/:id/select-answer
✅ POST /api/payments/:id/refund
✅ POST /api/documents/:id/sign
```

### Response Format

```typescript
// Success response
{
  "success": true,
  "data": {
    // actual data
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}

// Error response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Pagination

```typescript
// Cursor-based (for real-time feeds)
GET /api/questions?cursor=eyJpZCI6IjEyMyJ9&limit=20

Response:
{
  "data": [...],
  "meta": {
    "nextCursor": "eyJpZCI6IjE0MyJ9",
    "hasMore": true
  }
}

// Offset-based (for static lists)
GET /api/advisors?page=2&limit=20

Response:
{
  "data": [...],
  "meta": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Filtering & Sorting

```
GET /api/advisors?type=lawyer&specialization=corporate&minRating=4.5&sort=-rating,createdAt&limit=10

Query params:
- type: lawyer
- specialization: corporate
- minRating: 4.5
- sort: -rating (descending), createdAt (ascending)
- limit: 10
```

---

## 🎯 CACHING STRATEGY

### Multi-Level Caching

```
┌─────────────┐
│   Browser   │  Cache-Control headers (static assets)
└──────┬──────┘
       │
┌──────▼──────┐
│     CDN     │  CloudFront/Cloudflare (images, CSS, JS)
└──────┬──────┘
       │
┌──────▼──────┐
│ Application │  In-memory cache (hot data)
│   (Redis)   │
└──────┬──────┘
       │
┌──────▼──────┐
│  Database   │  Query result cache
│  (Postgres) │
└─────────────┘
```

### Cache Invalidation

```typescript
// Write-through cache
async function updateUser(userId: string, data: UpdateUserDto) {
  // Update database
  const user = await db.user.update({
    where: { id: userId },
    data
  });

  // Invalidate cache
  await redis.del(`user:${userId}:profile`);

  // Or update cache
  await redis.setex(`user:${userId}:profile`, 3600, JSON.stringify(user));

  return user;
}

// Cache-aside pattern
async function getUser(userId: string) {
  // Try cache first
  const cached = await redis.get(`user:${userId}:profile`);
  if (cached) return JSON.parse(cached);

  // Cache miss - fetch from DB
  const user = await db.user.findUnique({ where: { id: userId } });

  // Store in cache
  await redis.setex(`user:${userId}:profile`, 3600, JSON.stringify(user));

  return user;
}
```

---

## 🚀 DEPLOYMENT ARCHITECTURE

### Production Environment

```
┌──────────────────────────────────────┐
│          CLOUDFLARE CDN              │
│  (Global edge caching, DDoS protection)
└────────────┬─────────────────────────┘
             │
┌────────────▼─────────────────────────┐
│       VERCEL (Frontend)              │
│  - Next.js app (SSR + SSG)           │
│  - Auto-scaling                      │
│  - Edge functions                    │
└──────────────────────────────────────┘
             │
             │ API calls
             ▼
┌──────────────────────────────────────┐
│    AWS Application Load Balancer     │
└────────────┬─────────────────────────┘
             │
     ┌───────┴───────┐
     │               │
┌────▼────┐    ┌────▼────┐
│ API     │    │ API     │  (Auto-scaling)
│ Server  │    │ Server  │
│ (ECS)   │    │ (ECS)   │
└────┬────┘    └────┬────┘
     │               │
     └───────┬───────┘
             │
     ┌───────┴────────┬──────────┐
     │                │          │
┌────▼─────┐  ┌──────▼───┐  ┌──▼────┐
│PostgreSQL│  │  Redis   │  │  S3   │
│   RDS    │  │ElastiCache│  │       │
└──────────┘  └──────────┘  └───────┘
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml

name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test
      - run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -t api:${{ github.sha }} .
      - name: Push to ECR
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin
          docker push api:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster prod --service api --force-new-deployment

      - name: Deploy frontend to Vercel
        run: vercel --prod
```

### Environment Variables

```bash
# .env.production

# Database
DATABASE_URL=postgresql://user:pass@prod-db.amazonaws.com:5432/marketplace
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://prod-redis.amazonaws.com:6379

# Auth
JWT_SECRET=<secret>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
AWS_S3_BUCKET=marketplace-prod-files
AWS_REGION=eu-central-1

# Video
DAILY_API_KEY=<key>

# AI
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DEEPL_API_KEY=<key>

# Email
RESEND_API_KEY=re_...

# Monitoring
SENTRY_DSN=https://...
POSTHOG_API_KEY=phc_...
```

---

## 📊 MONITORING & OBSERVABILITY

### Logging Stack

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    // Production: send to CloudWatch or Datadog
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Usage
logger.info('User logged in', { userId, ip });
logger.error('Payment failed', { orderId, error });
```

### Metrics Collection

```typescript
import { Counter, Histogram } from 'prom-client';

// Custom metrics
const questionCounter = new Counter({
  name: 'questions_total',
  help: 'Total questions posted',
  labelNames: ['category', 'urgency']
});

const paymentDuration = new Histogram({
  name: 'payment_duration_seconds',
  help: 'Payment processing time',
  buckets: [0.1, 0.5, 1, 2, 5]
});

// Instrument code
questionCounter.inc({ category: 'legal', urgency: 'normal' });

const timer = paymentDuration.startTimer();
await processPayment();
timer();
```

### Alerting Rules

```yaml
# alerting.yml

alerts:
  - name: HighErrorRate
    condition: error_rate > 0.05
    duration: 5m
    severity: critical
    notification: pagerduty

  - name: SlowAPIResponse
    condition: p95_latency > 1000ms
    duration: 10m
    severity: warning
    notification: slack

  - name: DatabaseConnectionPool
    condition: db_pool_exhausted > 0
    duration: 1m
    severity: critical
    notification: pagerduty + slack
```

---

## 🧪 TESTING STRATEGY (DETAILED)

### Unit Tests (Jest)

```typescript
// user.service.spec.ts
describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UserService, PrismaService]
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = await service.createUser(userData);

      expect(result).toBeDefined();
      expect(result.email).toBe(userData.email);
      expect(result.passwordHash).not.toBe(userData.password);
    });

    it('should throw error for duplicate email', async () => {
      // ... test implementation
    });
  });
});
```

### Integration Tests (Supertest)

```typescript
// questions.e2e.spec.ts
describe('Questions API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login to get auth token
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' });

    authToken = loginRes.body.data.accessToken;
  });

  it('/api/questions (POST) should create a question', () => {
    return request(app.getHttpServer())
      .post('/api/questions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        category: 'legal',
        subcategory: 'employment',
        title: 'Test question',
        description: 'Test description',
        budget: 100
      })
      .expect(201)
      .expect(res => {
        expect(res.body.data.id).toBeDefined();
        expect(res.body.data.title).toBe('Test question');
      });
  });
});
```

### Load Testing (k6)

```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 200 },  // Ramp to 200
    { duration: '5m', target: 200 },  // Stay
    { duration: '2m', target: 0 }     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests < 500ms
    http_req_failed: ['rate<0.01']     // Error rate < 1%
  }
};

export default function () {
  const res = http.get('https://api.example.com/api/questions');

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500
  });

  sleep(1);
}
```

---

## 🔄 DISASTER RECOVERY

### Backup Strategy

```
Daily:
- Full database backup (automated via AWS RDS)
- Files backup (S3 versioning enabled)

Weekly:
- Backup verification (restore to staging)
- Cross-region replication check

Monthly:
- Disaster recovery drill
- Backup retention cleanup (keep 90 days)
```

### Recovery Procedures

```
RTO (Recovery Time Objective): 4 hours
RPO (Recovery Point Objective): 1 hour

Incident Response:
1. Detect (monitoring alerts)
2. Assess (severity, impact)
3. Notify (on-call engineer, stakeholders)
4. Mitigate (immediate fix or rollback)
5. Restore (from backup if needed)
6. Post-mortem (root cause analysis)
```

---

**END OF TECHNICAL ARCHITECTURE**
