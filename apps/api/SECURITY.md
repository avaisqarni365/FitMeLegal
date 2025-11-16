# Security Guide

This document outlines the security measures implemented in the FitMeLegal API and best practices for maintaining a secure application.

## Table of Contents

- [Security Features](#security-features)
- [Authentication & Authorization](#authentication--authorization)
- [Input Validation](#input-validation)
- [Rate Limiting](#rate-limiting)
- [CORS & CSP](#cors--csp)
- [Data Protection](#data-protection)
- [API Security](#api-security)
- [Security Headers](#security-headers)
- [Vulnerability Prevention](#vulnerability-prevention)
- [Security Checklist](#security-checklist)
- [Incident Response](#incident-response)

## Security Features

The FitMeLegal API implements multiple layers of security:

- **Authentication**: JWT-based authentication with secure tokens
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Comprehensive validation with class-validator
- **Rate Limiting**: Multi-tier rate limiting to prevent abuse
- **CORS**: Strict Cross-Origin Resource Sharing policies
- **CSP**: Content Security Policy headers
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **XSS Protection**: Input sanitization and output encoding
- **CSRF Protection**: Token-based CSRF protection
- **Encryption**: Password hashing with bcrypt, data encryption at rest
- **Audit Logging**: Comprehensive audit trail for admin actions
- **Security Headers**: Helmet.js for security headers

## Authentication & Authorization

### JWT Authentication

The API uses JSON Web Tokens (JWT) for authentication:

```typescript
// Token generation
const token = jwt.sign(
  { userId: user.id, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);
```

**Best Practices:**
- Use strong, unique JWT_SECRET (minimum 32 characters)
- Set appropriate expiration times (7 days default)
- Rotate secrets periodically
- Store tokens securely on client (httpOnly cookies preferred)
- Implement token refresh mechanism

### Role-Based Access Control (RBAC)

```typescript
@Roles(UserRole.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
async adminOnlyEndpoint() {
  // Only admins can access
}
```

**Roles:**
- `CLIENT`: Regular users
- `ADVISOR`: Legal/tax advisors
- `ADMIN`: System administrators

### Password Security

**Requirements:**
- Minimum 8 characters
- Must contain uppercase letters
- Must contain lowercase letters
- Must contain numbers
- Must contain special characters

**Implementation:**
```typescript
// Hashing with bcrypt (10 rounds)
const hashedPassword = await bcrypt.hash(password, 10);

// Verification
const isValid = await bcrypt.compare(password, hashedPassword);
```

### Two-Factor Authentication (2FA)

Currently not implemented. Recommended for future:
- TOTP-based 2FA
- SMS-based verification
- Email verification codes

## Input Validation

### Custom Validation Decorators

The API includes custom validators to prevent common attacks:

#### SQL Injection Prevention

```typescript
import { IsNotSQLInjection } from './common/decorators/validation.decorator';

class CreateUserDto {
  @IsNotSQLInjection()
  @IsString()
  name: string;
}
```

**Blocked patterns:**
- SQL keywords (SELECT, INSERT, UPDATE, DELETE, DROP, etc.)
- SQL comment markers (--,  /*, */)
- UNION statements
- Boolean injections (OR 1=1, AND 1=1)

#### XSS Prevention

```typescript
import { IsNotXSS } from './common/decorators/validation.decorator';

class CreatePostDto {
  @IsNotXSS()
  @IsString()
  content: string;
}
```

**Blocked patterns:**
- `<script>` tags
- `javascript:` protocol
- Event handlers (onclick, onerror, etc.)
- `<iframe>`, `<object>`, `<embed>` tags

#### Strong Password Validation

```typescript
import { IsStrongPassword } from './common/decorators/validation.decorator';

class RegisterDto {
  @IsStrongPassword()
  @MinLength(8)
  password: string;
}
```

#### Safe URL Validation

```typescript
import { IsSafeUrl } from './common/decorators/validation.decorator';

class CreateLinkDto {
  @IsSafeUrl()
  url: string; // Only allows http:// and https://
}
```

### Global Validation Pipe

```typescript
// main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,           // Strip unknown properties
    forbidNonWhitelisted: true, // Throw error on unknown properties
    transform: true,            // Auto-transform payloads
    transformOptions: {
      enableImplicitConversion: true,
    },
  })
);
```

**Benefits:**
- Automatic type conversion
- Strips malicious properties
- Validates all incoming data
- Prevents mass assignment vulnerabilities

## Rate Limiting

### Multi-Tier Rate Limiting

The API implements three-tier rate limiting:

```typescript
ThrottlerModule.forRoot([
  {
    name: 'short',
    ttl: 1000,    // 1 second
    limit: 10,    // 10 requests per second
  },
  {
    name: 'medium',
    ttl: 10000,   // 10 seconds
    limit: 50,    // 50 requests per 10 seconds
  },
  {
    name: 'long',
    ttl: 60000,   // 1 minute
    limit: 200,   // 200 requests per minute
  },
]);
```

### Custom Throttler Guard

```typescript
// Tracks by user ID if authenticated, otherwise by IP
protected async getTracker(req: Record<string, any>): Promise<string> {
  const userId = req.user?.id;
  return userId ? `user:${userId}` : req.ip;
}
```

### Endpoint-Specific Limits

```typescript
@SkipThrottle()  // Skip rate limiting
@Get('public-data')
async getPublicData() {}

@Throttle({ short: { ttl: 1000, limit: 3 } })  // Custom limit
@Post('login')
async login() {}
```

### Protection Against:
- Brute force attacks
- DoS/DDoS attacks
- Credential stuffing
- API abuse

## CORS & CSP

### CORS Configuration

```typescript
// main.ts
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
  maxAge: 3600,
});
```

**Production Setup:**
```bash
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Content Security Policy (CSP)

```typescript
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
})
```

## Data Protection

### Encryption at Rest

**Database:**
- PostgreSQL supports transparent data encryption (TDE)
- Encrypt sensitive columns (SSN, tax IDs)
- Use pg_crypto for field-level encryption

```sql
-- Example: Encrypt SSN
CREATE EXTENSION IF NOT EXISTS pgcrypto;

UPDATE users
SET ssn_encrypted = pgp_sym_encrypt(ssn, 'encryption-key')
WHERE ssn IS NOT NULL;
```

**File Storage:**
- Use AWS S3 server-side encryption (SSE-S3 or SSE-KMS)
- Encrypt files before upload for sensitive documents

### Encryption in Transit

- Enforce HTTPS for all API endpoints
- Use TLS 1.2 or higher
- Database connections over SSL

```typescript
// Prisma SSL connection
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  sslmode  = "require"
}
```

### PII (Personally Identifiable Information)

**Data Minimization:**
- Only collect necessary data
- Regular data cleanup policies
- User data export/deletion (GDPR compliance)

**Access Controls:**
- Limit PII access to authorized personnel
- Audit all PII access
- Encrypt PII in logs

### Secrets Management

**Never commit secrets to git:**
- Use environment variables
- Use secret management services (AWS Secrets Manager, HashiCorp Vault)
- Rotate secrets regularly

```bash
# .env.example (commit this)
DATABASE_URL=postgresql://user:password@localhost:5432/db

# .env (DO NOT commit)
DATABASE_URL=postgresql://realuser:realpassword@prod.db.com:5432/prod
```

## API Security

### API Key Authentication

For external integrations:

```typescript
@UseGuards(ApiKeyGuard)
@Get('webhook')
async webhook() {}
```

### Webhook Security

```typescript
// Verify webhook signatures (Stripe example)
const signature = request.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  request.rawBody,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

### Request Size Limits

```typescript
// main.ts
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

### File Upload Security

```typescript
// Validate file types
const allowedMimeTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
];

// Scan for malware (ClamAV)
const scanResult = await clamav.scanFile(file.path);
if (!scanResult.isClean) {
  throw new BadRequestException('File contains malware');
}

// Limit file size
@UseInterceptors(FileInterceptor('file', {
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
}))
```

## Security Headers

Helmet.js adds the following security headers:

```
X-DNS-Prefetch-Control: off
X-Frame-Options: SAMEORIGIN
Strict-Transport-Security: max-age=15552000; includeSubDomains
X-Download-Options: noopen
X-Content-Type-Options: nosniff
X-XSS-Protection: 0
Content-Security-Policy: default-src 'self'
```

### Custom Headers

```typescript
// Add custom security headers
app.use((req, res, next) => {
  res.setHeader('X-API-Version', '1.0');
  res.setHeader('X-Rate-Limit-Limit', '100');
  next();
});
```

## Vulnerability Prevention

### SQL Injection

**Protection:**
- Prisma ORM with parameterized queries
- Input validation with `@IsNotSQLInjection()`
- Never use raw SQL with user input

```typescript
// SAFE: Parameterized query
const users = await prisma.user.findMany({
  where: { email: userInput }
});

// UNSAFE: Raw SQL (avoid)
await prisma.$executeRaw`SELECT * FROM users WHERE email = ${userInput}`;

// If raw SQL needed, use parameterized:
await prisma.$executeRaw`SELECT * FROM users WHERE email = ${userInput}`;
```

### XSS (Cross-Site Scripting)

**Protection:**
- Input validation with `@IsNotXSS()`
- Output encoding
- CSP headers
- Sanitize HTML content

```typescript
import { sanitizeHtml } from './common/decorators/validation.decorator';

const clean = sanitizeHtml(userInput);
```

### CSRF (Cross-Site Request Forgery)

**Protection:**
- SameSite cookies
- CSRF tokens for state-changing operations
- Verify Origin/Referer headers

```typescript
// Enable CSRF protection
import * as csurf from 'csurf';
app.use(csurf({ cookie: true }));
```

### Path Traversal

**Protection:**
- Validate file paths
- Use allowlists for file access
- Never use user input directly in file paths

```typescript
// UNSAFE
const filePath = `./uploads/${req.params.filename}`;

// SAFE
const filename = path.basename(req.params.filename);
const filePath = path.join(__dirname, 'uploads', filename);
```

### NoSQL Injection

While we use SQL, if using NoSQL:

```typescript
// Validate all object keys
const allowedKeys = ['name', 'email'];
Object.keys(query).forEach(key => {
  if (!allowedKeys.includes(key)) {
    throw new BadRequestException('Invalid query parameter');
  }
});
```

### Command Injection

**Protection:**
- Never execute shell commands with user input
- If necessary, use allowlists and escaping

```typescript
// UNSAFE
exec(`convert ${userInput}.jpg output.png`);

// SAFE
const filename = userInput.replace(/[^a-zA-Z0-9]/g, '');
exec(`convert ${filename}.jpg output.png`);
```

### Timing Attacks

**Protection:**
- Use constant-time comparison for secrets

```typescript
import * as crypto from 'crypto';

function secureCompare(a: string, b: string): boolean {
  return crypto.timingSafeEqual(
    Buffer.from(a),
    Buffer.from(b)
  );
}
```

## Security Checklist

### Development

- [ ] Use environment variables for secrets
- [ ] Enable HTTPS in development
- [ ] Run security linters (eslint-plugin-security)
- [ ] Keep dependencies updated
- [ ] Run `npm audit` regularly
- [ ] Review code for security issues
- [ ] Use strong typing (TypeScript)

### Pre-Production

- [ ] Security audit completed
- [ ] Penetration testing performed
- [ ] OWASP Top 10 review
- [ ] Dependency vulnerability scan
- [ ] SSL/TLS certificate valid
- [ ] CORS configured for production domains
- [ ] Rate limiting tested
- [ ] Input validation tested
- [ ] Authentication flow tested
- [ ] Authorization rules verified

### Production

- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] Monitoring enabled
- [ ] Backup strategy in place
- [ ] Incident response plan ready
- [ ] Security contact published
- [ ] Regular security updates scheduled
- [ ] Audit logs reviewed regularly

### Continuous

- [ ] Monitor security advisories
- [ ] Update dependencies monthly
- [ ] Review audit logs weekly
- [ ] Penetration testing annually
- [ ] Security training for team
- [ ] Incident response drills
- [ ] Access review quarterly
- [ ] Certificate renewal monitoring

## Incident Response

### Security Incident Procedure

1. **Detection**
   - Monitor logs for suspicious activity
   - Alert on failed authentication attempts
   - Track unusual API usage patterns

2. **Containment**
   - Isolate affected systems
   - Revoke compromised credentials
   - Block malicious IPs

3. **Investigation**
   - Review audit logs
   - Identify attack vector
   - Assess damage

4. **Remediation**
   - Patch vulnerabilities
   - Restore from backups if needed
   - Update security measures

5. **Communication**
   - Notify affected users
   - Report to authorities if required
   - Update security documentation

### Contact

For security issues, contact:
- Email: security@fitmelegal.com
- PGP Key: [key fingerprint]

### Responsible Disclosure

We appreciate security researchers:
- Report vulnerabilities to security@fitmelegal.com
- Allow 90 days for remediation
- Do not exploit vulnerabilities
- Do not access user data
- Eligible for bug bounty rewards

## Security Tools

### Recommended Tools

**SAST (Static Analysis):**
- ESLint with security plugin
- SonarQube
- Snyk Code

**DAST (Dynamic Analysis):**
- OWASP ZAP
- Burp Suite
- Nikto

**Dependency Scanning:**
- npm audit
- Snyk
- Dependabot

**Secrets Detection:**
- git-secrets
- truffleHog
- GitGuardian

### Running Security Scans

```bash
# npm audit
npm audit --audit-level=moderate

# Snyk
npm install -g snyk
snyk test

# ESLint security plugin
npm install --save-dev eslint-plugin-security
```

## Compliance

### GDPR Compliance

- User data export functionality
- Right to be forgotten (data deletion)
- Consent management
- Privacy policy

### HIPAA Compliance (if applicable)

- PHI encryption at rest and in transit
- Access controls and audit logs
- Business Associate Agreements (BAA)
- Regular risk assessments

### PCI DSS (for payments)

- Never store credit card numbers
- Use Stripe for payment processing
- Tokenize payment methods
- Maintain PCI compliance documentation

## Security Training

### For Developers

- OWASP Top 10 awareness
- Secure coding practices
- Security testing
- Incident response procedures

### For Operations

- Server hardening
- Access control management
- Monitoring and alerting
- Backup and recovery

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [NestJS Security Best Practices](https://docs.nestjs.com/security/helmet)
- [Node.js Security Checklist](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)

---

**Last Updated:** Phase 4 Week 4
**Security Version:** 1.0.0
**Next Review:** Every 3 months
