# Production Deployment Guide

This guide covers deploying the FitMeLegal API to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Deployment Methods](#deployment-methods)
  - [Docker Deployment](#docker-deployment)
  - [Manual Deployment](#manual-deployment)
  - [Cloud Platforms](#cloud-platforms)
- [Database Setup](#database-setup)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Monitoring & Logging](#monitoring--logging)
- [Backup & Recovery](#backup--recovery)
- [Scaling](#scaling)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying to production, ensure you have:

- [ ] PostgreSQL 16+ database
- [ ] Redis 7+ instance
- [ ] Node.js 20+ (if manual deployment)
- [ ] Docker & Docker Compose (if container deployment)
- [ ] SSL/TLS certificates
- [ ] Domain name configured
- [ ] Environment variables configured
- [ ] Stripe account configured
- [ ] AWS S3 bucket configured
- [ ] SendGrid account configured
- [ ] OpenAI API key (for AI features)

## Environment Variables

### Required Variables

Create a `.env.production` file with the following variables:

```bash
# Application
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://user:password@host:5432/database?schema=public

# Redis
REDIS_URL=redis://:password@host:6379

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# OpenAI
OPENAI_API_KEY=sk-xxx

# SendGrid
SENDGRID_API_KEY=SG.xxx
EMAIL_FROM=noreply@yourdomain.com

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=/var/log/fitmelegal/app.log
```

### Security Checklist

- [ ] Use strong, unique values for `JWT_SECRET`
- [ ] Ensure database credentials are secure
- [ ] Use environment-specific API keys
- [ ] Enable SSL/TLS for all connections
- [ ] Restrict CORS to production domains only
- [ ] Enable rate limiting
- [ ] Configure proper file upload limits

## Deployment Methods

### Docker Deployment (Recommended)

Docker provides the easiest and most consistent deployment method.

#### 1. Build Docker Image

```bash
# From project root
docker build -f apps/api/Dockerfile -t fitmelegal-api:latest .
```

#### 2. Run with Docker Compose

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f api

# Stop services
docker-compose -f docker-compose.prod.yml down
```

#### 3. Run Database Migrations

```bash
docker-compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

### Manual Deployment

For manual deployment on a VPS or dedicated server:

#### 1. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL 16
sudo apt install -y postgresql-16

# Install Redis
sudo apt install -y redis-server

# Install PM2 for process management
sudo npm install -g pm2
```

#### 2. Clone and Build

```bash
# Clone repository
git clone https://github.com/yourusername/FitMeLegal.git
cd FitMeLegal

# Install dependencies
npm ci --only=production

# Generate Prisma Client
npx prisma generate --schema=./apps/api/prisma/schema.prisma

# Build application
npm run build -- --scope=@fitmelegal/api
```

#### 3. Run Database Migrations

```bash
npx prisma migrate deploy --schema=./apps/api/prisma/schema.prisma
```

#### 4. Start with PM2

```bash
# Start API
pm2 start apps/api/dist/main.js --name fitmelegal-api

# Configure to start on boot
pm2 startup
pm2 save

# Monitor
pm2 monit
```

### Cloud Platforms

#### AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p docker fitmelegal-api

# Create environment
eb create fitmelegal-api-prod

# Deploy
eb deploy
```

#### Google Cloud Run

```bash
# Build and push image
gcloud builds submit --tag gcr.io/PROJECT_ID/fitmelegal-api

# Deploy
gcloud run deploy fitmelegal-api \
  --image gcr.io/PROJECT_ID/fitmelegal-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### DigitalOcean App Platform

1. Connect your GitHub repository
2. Select `apps/api/Dockerfile`
3. Configure environment variables
4. Deploy

#### Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create fitmelegal-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# Add Redis
heroku addons:create heroku-redis:premium-0

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret

# Deploy
git push heroku main

# Run migrations
heroku run npx prisma migrate deploy
```

## Database Setup

### PostgreSQL Configuration

#### Production Settings

```sql
-- Create database
CREATE DATABASE fitmelegal_prod;

-- Create user
CREATE USER fitmelegal WITH ENCRYPTED PASSWORD 'your-password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE fitmelegal_prod TO fitmelegal;

-- Connect to database
\c fitmelegal_prod

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO fitmelegal;
```

#### Performance Tuning

Edit `/etc/postgresql/16/main/postgresql.conf`:

```conf
# Memory
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 16MB

# Connections
max_connections = 200

# Logging
log_min_duration_statement = 1000  # Log slow queries > 1s
```

#### Backup Configuration

```bash
# Automated daily backups
sudo crontab -e

# Add line:
0 2 * * * pg_dump fitmelegal_prod | gzip > /backups/fitmelegal_$(date +\%Y\%m\%d).sql.gz
```

### Redis Configuration

Edit `/etc/redis/redis.conf`:

```conf
# Security
requirepass your-strong-password
rename-command FLUSHDB ""
rename-command FLUSHALL ""

# Persistence
save 900 1
save 300 10
save 60 10000
appendonly yes

# Memory
maxmemory 512mb
maxmemory-policy allkeys-lru
```

## SSL/TLS Configuration

### Using Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot

# Generate certificate
sudo certbot certonly --standalone -d api.yourdomain.com

# Certificates will be at:
# /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/api.yourdomain.com/privkey.pem
```

### Nginx Configuration

Create `/etc/nginx/sites-available/fitmelegal`:

```nginx
upstream api {
    server localhost:3001;
}

server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 50M;

    location / {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /health {
        proxy_pass http://api/health;
        access_log off;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/fitmelegal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Monitoring & Logging

### Application Logs

```bash
# View logs with PM2
pm2 logs fitmelegal-api

# View logs with Docker
docker-compose logs -f api

# View log files
tail -f /var/log/fitmelegal/app.log
```

### Health Checks

```bash
# Basic health check
curl https://api.yourdomain.com/health

# Readiness check
curl https://api.yourdomain.com/health/ready

# Metrics
curl https://api.yourdomain.com/health/metrics
```

### Monitoring Services

#### Datadog

```bash
# Install Datadog agent
DD_API_KEY=your-api-key DD_SITE="datadoghq.com" bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"

# Configure APM
DD_APM_ENABLED=true
DD_LOGS_ENABLED=true
```

#### New Relic

```bash
npm install newrelic

# Add to main.ts
require('newrelic');
```

#### Prometheus + Grafana

See `MONITORING.md` for detailed Prometheus configuration.

## Backup & Recovery

### Database Backups

#### Automated Backups

```bash
#!/bin/bash
# /opt/scripts/backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgres"
DB_NAME="fitmelegal_prod"

# Create backup
pg_dump $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Upload to S3
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://your-backup-bucket/postgres/

# Keep only last 7 days locally
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

#### Restore from Backup

```bash
# Download from S3
aws s3 cp s3://your-backup-bucket/postgres/backup_20240115_020000.sql.gz .

# Restore
gunzip backup_20240115_020000.sql.gz
psql fitmelegal_prod < backup_20240115_020000.sql
```

### Redis Backups

```bash
# Manual backup
redis-cli --rdb /backups/redis/dump.rdb

# Restore
sudo cp dump.rdb /var/lib/redis/
sudo systemctl restart redis
```

## Scaling

### Horizontal Scaling

#### Load Balancer Configuration

```nginx
upstream api_cluster {
    least_conn;
    server api1.internal:3001;
    server api2.internal:3001;
    server api3.internal:3001;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://api_cluster;
    }
}
```

#### Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.prod.yml fitmelegal

# Scale API service
docker service scale fitmelegal_api=3
```

#### Kubernetes

```bash
# Create deployment
kubectl apply -f k8s/deployment.yml

# Scale replicas
kubectl scale deployment fitmelegal-api --replicas=3

# View pods
kubectl get pods
```

### Vertical Scaling

#### PM2 Cluster Mode

```bash
# Start with all CPU cores
pm2 start apps/api/dist/main.js -i max --name fitmelegal-api

# Or specific number of instances
pm2 start apps/api/dist/main.js -i 4 --name fitmelegal-api
```

### Database Scaling

#### Read Replicas

Configure Prisma for read replicas:

```typescript
// Update PrismaService
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Add read replica
const readReplica = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_READ_REPLICA_URL,
    },
  },
});
```

#### Connection Pooling

```bash
# Install PgBouncer
sudo apt install pgbouncer

# Configure /etc/pgbouncer/pgbouncer.ini
[databases]
fitmelegal_prod = host=localhost port=5432 dbname=fitmelegal_prod

[pgbouncer]
listen_port = 6432
listen_addr = *
auth_type = md5
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
```

## Troubleshooting

### Common Issues

#### API Not Starting

```bash
# Check logs
docker-compose logs api

# Check environment variables
docker-compose exec api env | grep DATABASE

# Test database connection
docker-compose exec api npx prisma db pull
```

#### Database Connection Errors

```bash
# Test connection
psql "postgresql://user:password@host:5432/database"

# Check firewall
sudo ufw status

# Check PostgreSQL is running
sudo systemctl status postgresql
```

#### High Memory Usage

```bash
# Check memory usage
docker stats

# Restart API
pm2 restart fitmelegal-api

# Check for memory leaks
node --inspect apps/api/dist/main.js
```

#### Slow Response Times

```bash
# Check database query performance
grep "Slow database query" /var/log/fitmelegal/app.log

# Check API response times
grep "Slow request" /var/log/fitmelegal/app.log

# Monitor with New Relic or Datadog
```

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=debug

# Restart API
pm2 restart fitmelegal-api
```

### Database Performance

```sql
-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check active connections
SELECT * FROM pg_stat_activity;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

## Security Hardening

See `SECURITY.md` for comprehensive security guidelines including:

- SSL/TLS configuration
- CORS and CSP policies
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection
- Authentication best practices

## CI/CD Pipeline

GitHub Actions automatically:
- Runs tests on every push
- Builds Docker image on main branch
- Deploys to production (manual approval)

See `.github/workflows/ci.yml` for full pipeline configuration.

## Monitoring Checklist

- [ ] Health checks configured
- [ ] Error tracking (Sentry/Datadog)
- [ ] Performance monitoring (New Relic)
- [ ] Log aggregation (ELK/CloudWatch)
- [ ] Uptime monitoring (Pingdom/UptimeRobot)
- [ ] Database monitoring
- [ ] Redis monitoring
- [ ] SSL certificate expiry monitoring

## Support

For deployment issues or questions:
- Check `TROUBLESHOOTING.md`
- Review `MONITORING.md`
- Contact DevOps team

---

**Last Updated:** Phase 4 Week 4
**Version:** 1.0.0
