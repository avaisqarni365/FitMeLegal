# Quick Start Guide - Running on Localhost

This guide will help you run the FitMeLegal API on your local machine.

## Prerequisites

- Node.js 20+ installed
- PostgreSQL 16+ installed (or Docker)
- npm or yarn package manager

## Step-by-Step Setup

### 1. Install Dependencies

```bash
# From project root
npm install
```

### 2. Set Up Environment Variables

```bash
# Copy the example .env file
cp apps/api/.env.example apps/api/.env

# The default values should work for local development
# DATABASE_URL is set to: postgresql://postgres:postgres@localhost:5432/fitmelegal_dev
```

**Important:** If your PostgreSQL has different credentials, edit `apps/api/.env`:
```env
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/fitmelegal_dev?schema=public"
```

### 3. Start PostgreSQL

**Option A: Using Docker (Recommended)**
```bash
# Start PostgreSQL and Redis
docker compose up -d postgres redis

# Check if they're running
docker compose ps
```

**Option B: Using Local PostgreSQL**
```bash
# Make sure PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list                 # macOS

# Create database
psql -U postgres -c "CREATE DATABASE fitmelegal_dev;"
```

### 4. Run Database Migrations

```bash
# Generate Prisma Client
npx prisma generate --schema=./apps/api/prisma/schema.prisma

# Run migrations to create tables
npx prisma migrate deploy --schema=./apps/api/prisma/schema.prisma

# Optional: Seed database with sample data
npx prisma db seed
```

### 5. Start the API Server

```bash
# Development mode (with hot reload)
npm run start:dev

# Or just the API
cd apps/api
npm run start:dev
```

### 6. Verify It's Running

Open your browser or use curl:

```bash
# Health check
curl http://localhost:3001/health

# API Documentation (Swagger)
open http://localhost:3001/api/docs
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "2024-11-16T...",
  "service": "FitMeLegal API"
}
```

## Common Issues & Solutions

### Issue: "Cannot find module '@prisma/client'"

**Solution:**
```bash
npx prisma generate --schema=./apps/api/prisma/schema.prisma
```

### Issue: "Can't reach database server"

**Solution:**
```bash
# Check if PostgreSQL is running
docker compose ps  # If using Docker
# or
sudo systemctl status postgresql  # If local

# Check DATABASE_URL in .env matches your setup
cat apps/api/.env | grep DATABASE_URL
```

### Issue: "Port 3001 already in use"

**Solution:**
```bash
# Find what's using the port
lsof -ti:3001

# Kill the process or change PORT in .env
echo "PORT=3002" >> apps/api/.env
```

### Issue: Migration errors

**Solution:**
```bash
# Reset database (⚠️ DELETES ALL DATA)
npx prisma migrate reset --schema=./apps/api/prisma/schema.prisma

# Then migrate again
npx prisma migrate deploy --schema=./apps/api/prisma/schema.prisma
```

## Testing the API

### 1. Register a User

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!",
    "firstName": "Test",
    "lastName": "User",
    "role": "CLIENT"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!"
  }'
```

Save the `access_token` from the response.

### 3. Access Protected Endpoint

```bash
# Replace YOUR_TOKEN with the access_token from login
curl http://localhost:3001/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Using Swagger UI (Recommended)

The easiest way to test the API is using the built-in Swagger documentation:

1. Open http://localhost:3001/api/docs
2. Click "Authorize" button
3. Enter your access_token: `Bearer YOUR_TOKEN`
4. Try any endpoint by clicking "Try it out"

## Development Workflow

```bash
# 1. Start database
docker compose up -d postgres redis

# 2. Start API in development mode
npm run start:dev

# 3. Make code changes (auto-reloads)

# 4. Run tests
npm run test                    # Unit tests
npm run test:e2e               # E2E tests
npm run test:cov               # With coverage

# 5. View logs
# Logs appear in terminal with structured format
```

## Database Management

### View Database with Prisma Studio

```bash
npx prisma studio --schema=./apps/api/prisma/schema.prisma
```

Opens at http://localhost:5555 - visual database browser.

### Reset Database

```bash
# ⚠️ WARNING: Deletes all data
npx prisma migrate reset --schema=./apps/api/prisma/schema.prisma
```

### Create Migration

```bash
# After changing schema.prisma
npx prisma migrate dev --name your_migration_name --schema=./apps/api/prisma/schema.prisma
```

## Environment Variables Reference

### Required for Basic Functionality
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fitmelegal_dev
JWT_SECRET=dev-secret-key-change-in-production
```

### Optional for Full Features
```env
# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...

# OpenAI (for AI features)
OPENAI_API_KEY=sk-...

# SendGrid (for emails)
SENDGRID_API_KEY=SG...
EMAIL_FROM=noreply@localhost

# CORS
ALLOWED_ORIGINS=http://localhost:3000
```

## Available Scripts

```bash
# Development
npm run start:dev              # Start with hot reload
npm run start:debug            # Start with debugger

# Building
npm run build                  # Build for production
npm run start:prod            # Run production build

# Testing
npm run test                   # Unit tests
npm run test:e2e              # E2E tests
npm run test:cov              # Coverage report

# Linting
npm run lint                   # Run ESLint
npm run format                # Format with Prettier

# Database
npx prisma studio             # Database GUI
npx prisma migrate dev        # Create migration
npx prisma migrate deploy     # Apply migrations
npx prisma db seed            # Seed database
```

## Next Steps

1. **Explore the API**: Visit http://localhost:3001/api/docs
2. **Read Documentation**: Check `/apps/api/TESTING.md` for API examples
3. **Run Tests**: `npm run test` to verify everything works
4. **Build Features**: Start developing your marketplace features!

## Getting Help

- **API Documentation**: http://localhost:3001/api/docs
- **Testing Guide**: `apps/api/TESTING_GUIDE.md`
- **Deployment Guide**: `apps/api/DEPLOYMENT.md`
- **Security Guide**: `apps/api/SECURITY.md`
- **Performance Guide**: `apps/api/PERFORMANCE.md`

## Troubleshooting

### Check Service Status

```bash
# Health check
curl http://localhost:3001/health

# Detailed health
curl http://localhost:3001/health/ready

# System metrics
curl http://localhost:3001/health/metrics
```

### View Logs

Development logs show in console with colors:
- 🟢 **LOG** - General information
- 🟡 **WARN** - Warnings
- 🔴 **ERROR** - Errors
- 🔵 **DEBUG** - Debug information

### Debug Mode

```bash
# Start with Node debugger
npm run start:debug

# Attach debugger in VS Code or Chrome DevTools
```

---

**Ready to go!** Your API should now be running at http://localhost:3001 🚀
