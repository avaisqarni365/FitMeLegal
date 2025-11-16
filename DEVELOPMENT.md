# Development Guide

## Prerequisites

- **Node.js 20+** - [Download](https://nodejs.org/)
- **PostgreSQL 16+** - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/)

> **Note:** Redis is optional for MVP. We'll add it in later phases when needed for caching and real-time features.

## Quick Start

### 1. Install PostgreSQL

If you don't have PostgreSQL installed locally:

**macOS:**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Windows:**
Download from https://www.postgresql.org/download/windows/

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database

```bash
# Login to PostgreSQL (default user is usually 'postgres')
psql -U postgres

# In psql, create the database:
CREATE DATABASE fitmelegal_dev;

# Exit psql
\q
```

### 3. Clone & Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd FitMeLegal

# Install all dependencies
npm install
```

### 4. Configure Environment

```bash
cd apps/api
cp .env.example .env
```

Edit `apps/api/.env` and update the DATABASE_URL with your PostgreSQL credentials:
```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/fitmelegal_dev?schema=public"
```

### 5. Setup Database Schema

```bash
# From apps/api directory
npm run prisma:generate
npm run prisma:migrate
```

### 6. Start Development Server

```bash
# From root directory
cd ../..
npm run dev
```

This will start:
- **API:** http://localhost:3001
- **API Docs:** http://localhost:3001/api/docs
- **Web (coming soon):** http://localhost:3000

## Useful Commands

### Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Create and apply migration
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Seed database (when seed script is ready)
npm run prisma:seed
```

### Development

```bash
# Run all apps in development mode
npm run dev

# Build all apps
npm run build

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format
```

### PostgreSQL

```bash
# Check PostgreSQL status
# macOS
brew services list

# Linux
sudo systemctl status postgresql

# Connect to database
psql -U postgres -d fitmelegal_dev

# List all databases
psql -U postgres -c "\l"

# Drop and recreate database (WARNING: deletes all data)
psql -U postgres -c "DROP DATABASE fitmelegal_dev;"
psql -U postgres -c "CREATE DATABASE fitmelegal_dev;"
```

## Project Structure

```
FitMeLegal/
├── apps/
│   ├── api/          # NestJS backend
│   ├── web/          # Next.js frontend (coming soon)
│   └── admin/        # Admin dashboard (coming soon)
├── packages/
│   └── shared/       # Shared types and utilities
├── docs/             # Documentation
└── scripts/          # Utility scripts
```

## Current Progress

### ✅ Completed
- [x] Monorepo setup with Turborepo
- [x] Shared package with types
- [x] NestJS API structure
- [x] Prisma schema (users, advisors, questions, answers, reviews)
- [x] Docker Compose for local development
- [x] Basic configuration files

### 🚧 In Progress
- [ ] Authentication module
- [ ] User management module
- [ ] Advisor module
- [ ] Questions module
- [ ] Answers module

### 📋 Next Steps
- [ ] Next.js frontend setup
- [ ] Authentication implementation
- [ ] User registration/login
- [ ] Advisor profiles
- [ ] Q&A marketplace

## Database Schema

Current models:
- **User** - All platform users (clients, advisors, admins)
- **Advisor** - Advisor profiles and verification
- **Question** - Client questions
- **Answer** - Advisor answers to questions
- **Review** - Client reviews of advisors

See `apps/api/prisma/schema.prisma` for full schema.

## API Documentation

When the API is running, access Swagger documentation at:
http://localhost:3001/api/docs

## Troubleshooting

### Port Already in Use

If you get port conflicts:

```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or use different port
PORT=3002 npm run dev
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
# macOS
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql

# Windows - Check in Services app or:
pg_ctl status

# Test connection
psql -U postgres -d fitmelegal_dev -c "SELECT version();"

# If connection fails, check your DATABASE_URL in .env file
# Make sure username, password, and database name are correct
```

### Prisma Issues

```bash
# Reset Prisma Client
rm -rf node_modules/.prisma
npm run prisma:generate

# Reset database (WARNING: deletes all data)
npm run prisma:migrate reset
```

## VS Code Setup

Recommended extensions:
- Prisma
- ESLint
- Prettier
- REST Client

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Turborepo Documentation](https://turbo.build/repo/docs)
