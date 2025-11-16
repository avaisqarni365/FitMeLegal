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

## Next Steps

- Week 4: Questions & Answers marketplace
- Email verification
- Password reset
- File upload (avatars, documents)
- Advisor verification workflow (admin)
