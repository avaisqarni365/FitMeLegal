# API Testing Guide

## Setup

### 1. Start the API Server

```bash
# Make sure PostgreSQL is running
# From root directory
npm run dev
```

API will be available at: http://localhost:3001

### 2. Seed the Database

```bash
cd apps/api
npm run prisma:seed
```

This creates sample users and advisors for testing.

## Test Accounts

### Admin
- **Email:** admin@fitmelegal.com
- **Password:** admin123

### Client
- **Email:** john.client@example.com
- **Password:** client123

### Advisors
- **Lawyer 1:** michael.lawyer@example.com
- **Lawyer 2:** sarah.lawyer@example.com
- **Tax Advisor:** david.tax@example.com
- **Dual Advisor:** emma.dual@example.com
- **Password (all):** advisor123

---

## API Endpoints

### Authentication

#### Register a New User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "role": "CLIENT",
    "userType": "PRIVATE",
    "firstName": "Test",
    "lastName": "User"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.client@example.com",
    "password": "client123"
  }'
```

**Response includes:**
- `accessToken` - Use in Authorization header
- `refreshToken` - Use to get new access token
- `user` - User profile

#### Get Current User
```bash
# Replace YOUR_ACCESS_TOKEN with token from login
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Refresh Token
```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

---

### User Profile

#### Get My Profile
```bash
curl http://localhost:3001/api/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Update My Profile
```bash
curl -X PATCH http://localhost:3001/api/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Updated",
    "lastName": "Name",
    "phone": "+49 123 456789",
    "language": "de",
    "timezone": "Europe/Berlin"
  }'
```

---

### Advisors

#### List All Advisors (Public)
```bash
# Basic listing
curl http://localhost:3001/api/advisors

# With filters
curl "http://localhost:3001/api/advisors?advisorType=LAWYER&specialization=corporate&minRating=4.5&page=1&limit=10"
```

**Available filters:**
- `advisorType` - LAWYER, TAX_ADVISOR, or DUAL
- `specialization` - e.g., corporate, employment
- `language` - e.g., en, de, fr
- `minRating` - minimum rating (0-5)
- `maxHourlyRate` - maximum hourly rate
- `page` - page number (default: 1)
- `limit` - items per page (default: 20)
- `sortBy` - rating, totalReviews, or createdAt
- `sortOrder` - asc or desc

#### Get Advisor by ID (Public)
```bash
curl http://localhost:3001/api/advisors/ADVISOR_ID
```

#### Create Advisor Profile (Advisors only)
```bash
# First, register as an ADVISOR
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newadvisor@example.com",
    "password": "SecurePass123!",
    "role": "ADVISOR",
    "firstName": "New",
    "lastName": "Advisor"
  }'

# Then login to get token
# Use the token to create advisor profile
curl -X POST http://localhost:3001/api/advisors \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "advisorType": "LAWYER",
    "specializations": ["corporate", "contracts"],
    "languages": ["en", "de"],
    "licenseNumber": "LAW-12345",
    "barAssociation": "Example Bar Association",
    "yearsExperience": 5,
    "bio": "Experienced lawyer specializing in corporate law",
    "hourlyRate": 150.0
  }'
```

#### Get My Advisor Profile
```bash
# Login as advisor first
curl http://localhost:3001/api/advisors/me \
  -H "Authorization: Bearer ADVISOR_ACCESS_TOKEN"
```

#### Update My Advisor Profile
```bash
curl -X PATCH http://localhost:3001/api/advisors/me \
  -H "Authorization: Bearer ADVISOR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "Updated bio text",
    "hourlyRate": 200.0,
    "specializations": ["corporate", "mergers-acquisitions", "contracts"],
    "active": true
  }'
```

---

## Using Swagger UI

The easiest way to test the API is using Swagger:

1. Open http://localhost:3001/api/docs
2. Click "Authorize" button
3. Enter: `Bearer YOUR_ACCESS_TOKEN`
4. Now you can test all endpoints interactively!

---

## Sample Workflow

### 1. Register & Login as Client
```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "myclient@example.com",
    "password": "SecurePass123!",
    "role": "CLIENT",
    "userType": "PRIVATE",
    "firstName": "My",
    "lastName": "Client"
  }'

# Login (save the accessToken from response)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "myclient@example.com",
    "password": "SecurePass123!"
  }'
```

### 2. Browse Advisors
```bash
# Get all lawyers
curl "http://localhost:3001/api/advisors?advisorType=LAWYER"

# Get tax advisors with rating > 4.5
curl "http://localhost:3001/api/advisors?advisorType=TAX_ADVISOR&minRating=4.5"

# Get specific advisor details
curl http://localhost:3001/api/advisors/ADVISOR_ID
```

### 3. Register & Setup as Advisor
```bash
# Register as advisor
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "myadvisor@example.com",
    "password": "SecurePass123!",
    "role": "ADVISOR",
    "firstName": "My",
    "lastName": "Advisor"
  }'

# Login as advisor (save token)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "myadvisor@example.com",
    "password": "SecurePass123!"
  }'

# Create advisor profile
curl -X POST http://localhost:3001/api/advisors \
  -H "Authorization: Bearer ADVISOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "advisorType": "LAWYER",
    "specializations": ["employment", "contracts"],
    "languages": ["en"],
    "licenseNumber": "LAW-99999",
    "barAssociation": "Example Bar",
    "yearsExperience": 3,
    "bio": "Employment law specialist",
    "hourlyRate": 120.0
  }'
```

---

### Questions & Answers

#### Post a Question (Client Only)
```bash
# Login as client first
curl -X POST http://localhost:3001/api/questions \
  -H "Authorization: Bearer CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "LEGAL",
    "subcategory": "employment",
    "title": "Review employment contract",
    "description": "I need help reviewing my employment contract before signing. Are there any red flags I should be aware of?",
    "budget": 150.0,
    "urgency": "NORMAL",
    "language": "en"
  }'
```

#### List All Questions (Public)
```bash
# Basic listing
curl http://localhost:3001/api/questions

# With filters
curl "http://localhost:3001/api/questions?category=LEGAL&subcategory=corporate&status=OPEN&minBudget=100&maxBudget=500&page=1&limit=10"

# Search
curl "http://localhost:3001/api/questions?search=contract"
```

#### Get My Questions
```bash
curl http://localhost:3001/api/questions/my-questions \
  -H "Authorization: Bearer CLIENT_TOKEN"
```

#### Get Question by ID (Public)
```bash
curl http://localhost:3001/api/questions/QUESTION_ID
```

#### Update My Question
```bash
curl -X PATCH http://localhost:3001/api/questions/QUESTION_ID \
  -H "Authorization: Bearer CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated title",
    "budget": 200.0
  }'
```

#### Delete My Question
```bash
curl -X DELETE http://localhost:3001/api/questions/QUESTION_ID \
  -H "Authorization: Bearer CLIENT_TOKEN"
```

#### Submit Answer to Question (Advisor Only)
```bash
# Login as advisor first
curl -X POST http://localhost:3001/api/answers/question/QUESTION_ID \
  -H "Authorization: Bearer ADVISOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Based on my review of your situation, here are the key points...",
    "price": 150.0
  }'
```

#### Get All Answers for a Question (Public)
```bash
curl http://localhost:3001/api/answers/question/QUESTION_ID
```

#### Get My Answers (Advisor Only)
```bash
curl http://localhost:3001/api/answers/my-answers \
  -H "Authorization: Bearer ADVISOR_TOKEN"
```

#### Update My Answer (if still pending)
```bash
curl -X PATCH http://localhost:3001/api/answers/ANSWER_ID \
  -H "Authorization: Bearer ADVISOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Updated answer content",
    "price": 175.0
  }'
```

#### Select Answer as Best (Question Owner Only)
```bash
curl -X POST http://localhost:3001/api/questions/QUESTION_ID/select-answer/ANSWER_ID \
  -H "Authorization: Bearer CLIENT_TOKEN"
```

This will:
- Mark the selected answer as ACCEPTED
- Mark other answers as REJECTED
- Change question status to ANSWERED

---

## Fixed-Price Services

### List All Services (Public)
```bash
# Basic listing
curl http://localhost:3001/api/services

# With filters
curl "http://localhost:3001/api/services?category=LEGAL&subcategory=contract-review&minRating=4.5&maxPrice=200&page=1&limit=10"
```

**Available filters:**
- `category` - LEGAL or TAX
- `subcategory` - e.g., contract-review, employment, personal-tax
- `language` - e.g., en, de, fr
- `minRating` - minimum average rating (0-5)
- `maxPrice` - maximum price
- `maxDeliveryTime` - maximum delivery time in days
- `search` - search in title and description
- `featured` - show only featured services
- `page` - page number (default: 1)
- `limit` - items per page (default: 20)
- `sortBy` - createdAt, price, averageRating, or totalOrders
- `sortOrder` - asc or desc

### Get Service by ID (Public)
```bash
curl http://localhost:3001/api/services/SERVICE_ID
```

### Create Service (Advisor Only)
```bash
# Login as advisor first
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "michael.lawyer@example.com",
    "password": "advisor123"
  }'

# Create service (save the accessToken from login)
curl -X POST http://localhost:3001/api/services \
  -H "Authorization: Bearer ADVISOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "LEGAL",
    "subcategory": "contract-review",
    "title": "Shareholder Agreement Review",
    "description": "Comprehensive review of shareholder agreements with focus on voting rights, transfer restrictions, and exit provisions.",
    "price": 300.0,
    "currency": "EUR",
    "deliveryTime": 5,
    "revisions": 2,
    "requirements": [
      "Current shareholder agreement",
      "Company structure details",
      "Specific concerns"
    ],
    "deliverables": [
      "Detailed review report",
      "Recommendations document",
      "60-minute consultation"
    ],
    "languages": ["en", "de"],
    "tags": ["corporate", "shareholders", "governance"]
  }'
```

### Get My Services (Advisor Only)
```bash
curl http://localhost:3001/api/services/my-services \
  -H "Authorization: Bearer ADVISOR_TOKEN"
```

### Update Service (Owner Only)
```bash
curl -X PATCH http://localhost:3001/api/services/SERVICE_ID \
  -H "Authorization: Bearer ADVISOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 350.0,
    "deliveryTime": 4,
    "active": true
  }'
```

### Delete Service (Owner Only)
```bash
curl -X DELETE http://localhost:3001/api/services/SERVICE_ID \
  -H "Authorization: Bearer ADVISOR_TOKEN"
```

**Note:** Cannot delete services with active orders.

---

## Orders & Bookings

### Create Order (Client Only)
```bash
# Login as client first
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.client@example.com",
    "password": "client123"
  }'

# Create order for a service
curl -X POST http://localhost:3001/api/orders/service/SERVICE_ID \
  -H "Authorization: Bearer CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requirements": {
      "documentUrl": "https://example.com/contract.pdf",
      "additionalInfo": "Please review the non-compete clause carefully"
    },
    "notes": "I need this reviewed before signing next Monday"
  }'
```

### Get My Orders (Client or Advisor)
```bash
# Clients see their orders, Advisors see orders for their services
curl http://localhost:3001/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN"

# With filters
curl "http://localhost:3001/api/orders?status=IN_PROGRESS&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Order statuses:**
- `PENDING` - Waiting for advisor confirmation
- `CONFIRMED` - Advisor confirmed, ready to start
- `IN_PROGRESS` - Work in progress
- `REVISION_REQUESTED` - Client requested changes
- `COMPLETED` - Deliverables submitted
- `CANCELLED` - Order cancelled
- `DISPUTED` - Dispute raised

### Get Order by ID
```bash
curl http://localhost:3001/api/orders/ORDER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Confirm Order (Advisor Only)
```bash
# Advisor confirms they accept the order
curl -X POST http://localhost:3001/api/orders/ORDER_ID/confirm \
  -H "Authorization: Bearer ADVISOR_TOKEN"
```

### Start Order (Advisor Only)
```bash
# Advisor starts working on the order
curl -X POST http://localhost:3001/api/orders/ORDER_ID/start \
  -H "Authorization: Bearer ADVISOR_TOKEN"
```

### Submit Deliverables (Advisor Only)
```bash
# Advisor submits completed work
curl -X POST http://localhost:3001/api/orders/ORDER_ID/submit-deliverables \
  -H "Authorization: Bearer ADVISOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deliverables": [
      "https://example.com/review-report.pdf",
      "https://example.com/recommendations.pdf"
    ]
  }'
```

This marks the order as COMPLETED.

### Request Revision (Client Only)
```bash
# Client requests changes to deliverables
curl -X POST http://localhost:3001/api/orders/ORDER_ID/request-revision \
  -H "Authorization: Bearer CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Please add more details about the termination clause"
  }'
```

**Note:** Only available if service includes revisions and limit not reached.

### Complete Order (Client Only)
```bash
# Client accepts deliverables and completes the order
curl -X POST http://localhost:3001/api/orders/ORDER_ID/complete \
  -H "Authorization: Bearer CLIENT_TOKEN"
```

This triggers payment processing and updates advisor/service statistics.

### Cancel Order (Client or Advisor)
```bash
curl -X POST http://localhost:3001/api/orders/ORDER_ID/cancel \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Client no longer needs the service"
  }'
```

**Note:** Cannot cancel COMPLETED orders.

---

## Order Workflow Example

### Full Order Lifecycle
```bash
# 1. Client browses services
curl http://localhost:3001/api/services?category=LEGAL

# 2. Client creates order
curl -X POST http://localhost:3001/api/orders/service/service-1 \
  -H "Authorization: Bearer CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"requirements": {"document": "contract.pdf"}, "notes": "Urgent"}'

# 3. Advisor confirms order
curl -X POST http://localhost:3001/api/orders/ORDER_ID/confirm \
  -H "Authorization: Bearer ADVISOR_TOKEN"

# 4. Advisor starts work
curl -X POST http://localhost:3001/api/orders/ORDER_ID/start \
  -H "Authorization: Bearer ADVISOR_TOKEN"

# 5. Advisor submits deliverables
curl -X POST http://localhost:3001/api/orders/ORDER_ID/submit-deliverables \
  -H "Authorization: Bearer ADVISOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"deliverables": ["review.pdf"]}'

# 6. Client reviews and either:
#    a) Requests revision
curl -X POST http://localhost:3001/api/orders/ORDER_ID/request-revision \
  -H "Authorization: Bearer CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Need more detail"}'

#    b) Completes order
curl -X POST http://localhost:3001/api/orders/ORDER_ID/complete \
  -H "Authorization: Bearer CLIENT_TOKEN"
```

---

## Common Issues

### "Unauthorized" Error
- Make sure you're using a valid access token
- Tokens expire after 15 minutes - use refresh token to get new one
- Format: `Authorization: Bearer YOUR_TOKEN`

### "Forbidden" Error
- You're trying to access a resource that requires specific role
- Example: Only ADVISOR role can create advisor profiles

### "Not Found" Error
- Check the ID you're using exists
- For advisors, only VERIFIED advisors are visible in public listing

---

## Database Access

### View Database in GUI
```bash
cd apps/api
npm run prisma:studio
```

Opens Prisma Studio at http://localhost:5555

### Reset Database
```bash
cd apps/api
npx prisma migrate reset
npm run prisma:seed
```

**⚠️ Warning:** This deletes all data!

---

## Completed Features

✅ **Phase 1 Month 1** (Weeks 1-4):
- Week 1: Project setup, database schema, Prisma
- Week 2: Authentication & JWT
- Week 3: User profiles & Advisor management
- Week 4: Questions & Answers marketplace

✅ **Phase 1 Month 2 Week 5**:
- Fixed-price services marketplace
- Order booking workflow
- Service management for advisors
- Complete order lifecycle (PENDING → COMPLETED)
- Revision system

## Next Steps

**Phase 1 Month 2** (Remaining):
- Week 6: Payment integration with Stripe
- Week 7: Messaging & real-time communication
- Week 8: Reviews & ratings system

**Future Features:**
- Email verification
- Password reset
- File upload (avatars, documents)
- Advisor verification workflow (admin)
- Video call integration
- Document workspace
- Subscription plans
