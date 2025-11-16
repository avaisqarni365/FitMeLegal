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

## Payments (Stripe Test Mode)

### Environment Setup
Make sure you have Stripe test credentials in your `.env` file:
```bash
STRIPE_SECRET_KEY=sk_test_51DummyTestKeyForDevelopment123456789
STRIPE_PUBLISHABLE_KEY=pk_test_51DummyTestKeyForDevelopment123456789
STRIPE_WEBHOOK_SECRET=whsec_DummyWebhookSecretForDevelopment123
STRIPE_MODE=test
```

**Note:** These are dummy keys for testing. Replace with your own Stripe test keys from https://dashboard.stripe.com/test/apikeys

### Create Payment Intent
```bash
# After creating an order, create a payment intent
curl -X POST http://localhost:3001/api/payments/create-payment-intent \
  -H "Authorization: Bearer CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORDER_ID"
  }'
```

**Response:**
```json
{
  "paymentIntentId": "pi_...",
  "clientSecret": "pi_..._secret_...",
  "amount": 150.00,
  "currency": "EUR",
  "status": "requires_payment_method"
}
```

### Get Payment Status
```bash
curl http://localhost:3001/api/payments/order/ORDER_ID/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "orderId": "order-uuid",
  "paymentStatus": "PROCESSING",
  "amount": 150.00,
  "currency": "EUR",
  "stripeStatus": "requires_payment_method",
  "paymentIntentId": "pi_..."
}
```

### Simulate Test Payment (Development Only)
For easy testing, you can use the test payment endpoint that auto-confirms payment:

```bash
curl -X POST http://localhost:3001/api/payments/test-payment/ORDER_ID \
  -H "Authorization: Bearer CLIENT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Test payment successful",
  "paymentIntentId": "pi_...",
  "orderId": "order-uuid"
}
```

This automatically:
- Creates a payment intent
- Confirms payment with test card
- Updates order to CONFIRMED status
- Sets payment status to SUCCEEDED

### Stripe Webhook Testing

The webhook endpoint is available at: `http://localhost:3001/api/payments/webhook`

To test webhooks locally with Stripe CLI:

```bash
# Install Stripe CLI (one-time)
# https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3001/api/payments/webhook

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
stripe trigger charge.refunded
```

### Payment Workflow Example

Complete order with payment flow:

```bash
# 1. Client creates order
curl -X POST http://localhost:3001/api/orders/service/service-1 \
  -H "Authorization: Bearer CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"requirements": {"document": "contract.pdf"}, "notes": "Urgent"}'

# 2. Advisor confirms order
curl -X POST http://localhost:3001/api/orders/ORDER_ID/confirm \
  -H "Authorization: Bearer ADVISOR_TOKEN"

# 3. Client simulates test payment (easiest for development)
curl -X POST http://localhost:3001/api/payments/test-payment/ORDER_ID \
  -H "Authorization: Bearer CLIENT_TOKEN"

# OR create real payment intent (for production-like testing)
curl -X POST http://localhost:3001/api/payments/create-payment-intent \
  -H "Authorization: Bearer CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId": "ORDER_ID"}'

# 4. Check payment status
curl http://localhost:3001/api/payments/order/ORDER_ID/status \
  -H "Authorization: Bearer CLIENT_TOKEN"

# 5. Advisor starts work (after payment confirmed)
curl -X POST http://localhost:3001/api/orders/ORDER_ID/start \
  -H "Authorization: Bearer ADVISOR_TOKEN"

# 6. Continue with order workflow...
```

### Stripe Test Cards

When using real payment intents (not test-payment endpoint), use these test cards:

**Success:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**Decline:**
- Card: `4000 0000 0000 0002`

**Requires Authentication:**
- Card: `4000 0027 6000 3184`

More test cards: https://stripe.com/docs/testing

### Payment Statuses

**Order Payment Status:**
- `PENDING` - No payment initiated
- `PROCESSING` - Payment intent created
- `SUCCEEDED` - Payment confirmed
- `FAILED` - Payment failed
- `REFUNDED` - Payment refunded

**Stripe Payment Intent Status:**
- `requires_payment_method` - Waiting for payment method
- `requires_confirmation` - Needs confirmation
- `processing` - Being processed
- `succeeded` - Payment succeeded
- `canceled` - Payment canceled

---

## Messaging & Real-time Communication

### Start a New Conversation
```bash
# Start a conversation with another user
curl -X POST http://localhost:3001/api/messaging/conversations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "receiverId": "RECEIVER_USER_ID",
    "subject": "Question about contract review service",
    "initialMessage": "Hi, I have a question about your contract review service. Can you help me?"
  }'
```

**Response:**
```json
{
  "id": "conversation-uuid",
  "initiatorId": "your-user-id",
  "receiverId": "receiver-user-id",
  "subject": "Question about contract review service",
  "lastMessageAt": "2024-11-16T10:30:00.000Z",
  "initiatorUnread": 0,
  "receiverUnread": 1,
  "initiator": {
    "id": "your-user-id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "avatarUrl": null
  },
  "receiver": {
    "id": "receiver-user-id",
    "firstName": "Michael",
    "lastName": "Johnson",
    "email": "michael.lawyer@example.com",
    "avatarUrl": null
  },
  "messages": [
    {
      "id": "message-uuid",
      "content": "Hi, I have a question...",
      "createdAt": "2024-11-16T10:30:00.000Z"
    }
  ]
}
```

**Optional:** Link conversation to an order:
```bash
curl -X POST http://localhost:3001/api/messaging/conversations \
  -H "Authorization: Bearer CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "receiverId": "ADVISOR_USER_ID",
    "orderId": "ORDER_ID",
    "subject": "Question about my order",
    "initialMessage": "I have a question about the deliverables for my order."
  }'
```

### Get All My Conversations
```bash
# Get all conversations
curl http://localhost:3001/api/messaging/conversations \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get only conversations with unread messages
curl "http://localhost:3001/api/messaging/conversations?unreadOnly=true" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With pagination
curl "http://localhost:3001/api/messaging/conversations?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "data": [
    {
      "id": "conversation-uuid",
      "otherUser": {
        "id": "user-id",
        "firstName": "Michael",
        "lastName": "Johnson",
        "email": "michael.lawyer@example.com",
        "role": "ADVISOR"
      },
      "subject": "Question about contract review",
      "lastMessageAt": "2024-11-16T10:30:00.000Z",
      "unreadCount": 2,
      "messages": [
        {
          "id": "message-uuid",
          "content": "Last message preview...",
          "createdAt": "2024-11-16T10:30:00.000Z"
        }
      ]
    }
  ],
  "meta": {
    "total": 5,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### Get Conversation Details
```bash
curl http://localhost:3001/api/messaging/conversations/CONVERSATION_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Messages in a Conversation
```bash
# Get latest 50 messages (default)
curl http://localhost:3001/api/messaging/conversations/CONVERSATION_ID/messages \
  -H "Authorization: Bearer YOUR_TOKEN"

# With pagination
curl "http://localhost:3001/api/messaging/conversations/CONVERSATION_ID/messages?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "data": [
    {
      "id": "message-uuid-1",
      "conversationId": "conversation-uuid",
      "senderId": "user-id-1",
      "content": "Hi, I have a question...",
      "attachments": [],
      "readAt": "2024-11-16T10:35:00.000Z",
      "createdAt": "2024-11-16T10:30:00.000Z",
      "sender": {
        "id": "user-id-1",
        "firstName": "John",
        "lastName": "Doe",
        "avatarUrl": null
      }
    },
    {
      "id": "message-uuid-2",
      "conversationId": "conversation-uuid",
      "senderId": "user-id-2",
      "content": "Yes, I can help you with that!",
      "attachments": [],
      "readAt": null,
      "createdAt": "2024-11-16T10:32:00.000Z",
      "sender": {
        "id": "user-id-2",
        "firstName": "Michael",
        "lastName": "Johnson",
        "avatarUrl": null
      }
    }
  ],
  "meta": {
    "total": 2,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

### Send a Message
```bash
# Send a text message
curl -X POST http://localhost:3001/api/messaging/conversations/CONVERSATION_ID/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Thank you for your response! When can we schedule a call?"
  }'

# Send a message with attachments
curl -X POST http://localhost:3001/api/messaging/conversations/CONVERSATION_ID/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Here are the documents you requested.",
    "attachments": ["https://example.com/document1.pdf", "https://example.com/document2.pdf"]
  }'
```

**Response:**
```json
{
  "id": "message-uuid",
  "conversationId": "conversation-uuid",
  "senderId": "your-user-id",
  "content": "Thank you for your response!",
  "attachments": [],
  "readAt": null,
  "createdAt": "2024-11-16T10:40:00.000Z",
  "sender": {
    "id": "your-user-id",
    "firstName": "John",
    "lastName": "Doe",
    "avatarUrl": null
  }
}
```

### Mark Conversation as Read
```bash
curl -X POST http://localhost:3001/api/messaging/conversations/CONVERSATION_ID/mark-read \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Marked as read"
}
```

This will:
- Mark all unread messages in the conversation as read
- Reset your unread count for this conversation to 0
- Update the `readAt` timestamp on all messages you haven't read

### Get Unread Message Count
```bash
curl http://localhost:3001/api/messaging/unread-count \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "unreadCount": 5
}
```

---

## Messaging Workflow Example

Complete messaging flow between client and advisor:

```bash
# 1. Client starts conversation with advisor
curl -X POST http://localhost:3001/api/messaging/conversations \
  -H "Authorization: Bearer CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "receiverId": "ADVISOR_USER_ID",
    "subject": "Question about your service",
    "initialMessage": "Hi, can you help me with a contract review?"
  }'
# Save the conversation ID from response

# 2. Advisor checks unread count
curl http://localhost:3001/api/messaging/unread-count \
  -H "Authorization: Bearer ADVISOR_TOKEN"

# 3. Advisor gets all conversations
curl http://localhost:3001/api/messaging/conversations \
  -H "Authorization: Bearer ADVISOR_TOKEN"

# 4. Advisor gets messages in conversation
curl http://localhost:3001/api/messaging/conversations/CONVERSATION_ID/messages \
  -H "Authorization: Bearer ADVISOR_TOKEN"

# 5. Advisor marks conversation as read
curl -X POST http://localhost:3001/api/messaging/conversations/CONVERSATION_ID/mark-read \
  -H "Authorization: Bearer ADVISOR_TOKEN"

# 6. Advisor sends reply
curl -X POST http://localhost:3001/api/messaging/conversations/CONVERSATION_ID/messages \
  -H "Authorization: Bearer ADVISOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Yes, I can help you! I specialize in contract reviews. Please share the contract."
  }'

# 7. Client gets updated conversation
curl http://localhost:3001/api/messaging/conversations/CONVERSATION_ID/messages \
  -H "Authorization: Bearer CLIENT_TOKEN"

# 8. Client replies with attachment
curl -X POST http://localhost:3001/api/messaging/conversations/CONVERSATION_ID/messages \
  -H "Authorization: Bearer CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Here is my employment contract. Please review it.",
    "attachments": ["https://example.com/contract.pdf"]
  }'
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

✅ **Phase 1 Month 2 Week 6**:
- Stripe payment integration (test mode)
- Payment intent creation and confirmation
- Webhook handling for payment events
- Test payment simulation for development
- Payment status tracking
- Support for test cards and Stripe CLI

✅ **Phase 1 Month 2 Week 7**:
- Direct messaging between users (client ↔ advisor)
- Conversation management with unread tracking
- Message history with pagination
- Unread message counters
- Mark conversations as read
- Optional conversation-order linking
- Attachment support for messages

## Next Steps

**Phase 1 Month 2** (Remaining):
- Week 8: Reviews & ratings system

**Future Features:**
- Email verification
- Password reset
- File upload (avatars, documents)
- Advisor verification workflow (admin)
- Video call integration
- Document workspace
- Subscription plans
