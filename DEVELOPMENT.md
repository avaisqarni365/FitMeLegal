# Development Guide

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL client (optional, for direct DB access)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Database Services

```bash
docker-compose up -d
```

This will start:
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`

### 3. Setup API Environment

```bash
cd apps/api
cp .env.example .env
```

### 4. Run Database Migrations

```bash
cd apps/api
npm run prisma:generate
npm run prisma:migrate
```

### 5. Start Development Servers

```bash
# From root directory
npm run dev
```

This will start:
- API: http://localhost:3001
- API Docs: http://localhost:3001/api/docs
- Web (when ready): http://localhost:3000

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

### Docker

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
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
docker-compose ps

# Restart database
docker-compose restart postgres

# Check logs
docker-compose logs postgres
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
