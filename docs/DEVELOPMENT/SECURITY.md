# Security Guidelines

This document outlines security best practices, guidelines, and requirements for the MTC Platform.

## Table of Contents

1. [Security Overview](#security-overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [API Security](#api-security)
4. [Database Security](#database-security)
5. [Plugin Security](#plugin-security)
6. [Environment Security](#environment-security)
7. [Deployment Security](#deployment-security)
8. [Monitoring & Logging](#monitoring--logging)
9. [Security Testing](#security-testing)
10. [Incident Response](#incident-response)

## Security Overview

The MTC Platform implements defense-in-depth security with multiple layers of protection:

- **Multi-tenant isolation** at database and application layers
- **API key authentication** for all administrative operations
- **Input validation and sanitization** for all user inputs
- **Rate limiting** to prevent abuse
- **Security headers** for web-based interfaces
- **Audit logging** for all sensitive operations

## Authentication & Authorization

### API Key Authentication

All administrative API endpoints require API key authentication:

```bash
curl -H "x-api-key: sk_test_admin123456" http://localhost:3000/api/users
```

#### Security Requirements

- **Strong API Keys**: Minimum 32 characters with random entropy
- **Environment Separation**: Different API keys per environment
- **Regular Rotation**: Rotate API keys at least quarterly
- **Secure Storage**: Never commit API keys to version control

#### API Key Format

```
sk_live_<32-character-random-string>  # Production
sk_test_<32-character-random-string> # Development/Staging
```

### User Roles

The platform supports role-based access control:

| Role | Permissions | Use Case |
|------|-------------|----------|
| `super_admin` | Full platform access | Platform operators |
| `tenant_admin` | Tenant-level access | Store administrators |
| `customer` | Limited access | End customers |

### Session Management

- **JWT Tokens**: Short-lived tokens (15 minutes)
- **Refresh Tokens**: Long-lived tokens (7 days)
- **Secure Storage**: HttpOnly, Secure cookies
- **Revocation**: Immediate token revocation on logout

## API Security

### Rate Limiting

Implement rate limiting to prevent abuse:

```typescript
// Rate limiting configuration
const rateLimits = {
  default: { requests: 100, window: '15m' },
  auth: { requests: 5, window: '15m' },
  upload: { requests: 10, window: '1h' }
};
```

### Input Validation

All inputs must be validated using Zod schemas:

```typescript
const createUserSchema = z.object({
  email: z.string().email().max(255),
  role: z.enum(['customer', 'tenant_admin', 'super_admin']),
  metadata: z.record(z.any()).optional()
});
```

### Output Sanitization

Sanitize all outputs to prevent XSS:

```typescript
import DOMPurify from 'dompurify';

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html);
}
```

### Security Headers

Implement security headers for all HTTP responses:

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true }
}));
```

### CORS Configuration

Configure CORS properly for your domains:

```typescript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
}));
```

## Database Security

### Multi-tenant Isolation

Enforce tenant isolation at the database level:

```sql
-- All queries must include tenant_id filter
SELECT * FROM products WHERE tenant_id = ? AND id = ?;
```

### Connection Security

- **SSL/TLS**: Always use encrypted connections in production
- **Connection Pooling**: Use connection pooling with proper limits
- **Least Privilege**: Database users have minimal required permissions

### Data Encryption

- **Encryption at Rest**: Encrypt sensitive data in database
- **Encryption in Transit**: Always use HTTPS/TLS
- **Field-level Encryption**: Encrypt sensitive fields (PII, payment data)

### SQL Injection Prevention

Use parameterized queries exclusively:

```typescript
// ✅ Correct - Parameterized query
const result = await db.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// ❌ Wrong - SQL injection vulnerable
const result = await db.query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

## Plugin Security

### Plugin Sandboxing

Plugins run in controlled environments:

- **Limited Permissions**: Plugins have minimal required permissions
- **Resource Limits**: CPU, memory, and network restrictions
- **File System Access**: Restricted to plugin directories

### Plugin Manifest Security

Each plugin must declare required permissions:

```json
{
  "name": "payment-plugin",
  "permissions": [
    "read:orders",
    "write:payments",
    "webhook:payment_events"
  ]
}
```

### Plugin Validation

- **Code Review**: All plugins undergo security review
- **Static Analysis**: Automated security scanning
- **Dependency Scanning**: Check for vulnerable dependencies

### Plugin API Security

- **Input Validation**: Validate all plugin inputs
- **Output Sanitization**: Sanitize plugin outputs
- **Error Handling**: Prevent information leakage

## Environment Security

### Environment Variables

Never commit sensitive environment variables:

```bash
# .env.example (safe to commit)
SUPER_ADMIN_API_KEY=sk_test_changehere
DATABASE_URL=postgresql://user:pass@localhost:5432/db_name

# .env.local (never commit)
SUPER_ADMIN_API_KEY=sk_live_abc123...
DATABASE_URL=postgresql://user:secure_pass@prod-db:5432/prod_db
```

### Secret Management

Use proper secret management in production:

- **Cloud Provider**: AWS Secrets Manager, Azure Key Vault, GCP Secret Manager
- **Docker Secrets**: Use Docker secrets for containerized deployments
- **Kubernetes Secrets**: Use Kubernetes secrets with proper RBAC

### File Permissions

Set appropriate file permissions:

```bash
# Configuration files
chmod 600 .env.local
chmod 644 .env.example

# Scripts
chmod 755 scripts/*.sh

# Database files
chmod 600 db.sqlite
```

## Deployment Security

### Production Deployment

#### Network Security

- **Firewall Rules**: Restrict access to necessary ports only
- **VPN Access**: Use VPN for administrative access
- **DDoS Protection**: Implement DDoS protection services

#### Container Security

```dockerfile
# Use non-root user
USER node

# Minimal base image
FROM node:18-alpine

# Remove unnecessary packages
RUN apk del --purge \
    && rm -rf /var/cache/apk/*
```

#### Cloudflare Workers Security

- **Environment Isolation**: Separate environments for Workers
- **Binding Security**: Secure D1 and KV bindings
- **Secret Management**: Use Workers secrets for sensitive data

### SSL/TLS Configuration

Use strong SSL/TLS configuration:

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
```

### Backup Security

- **Encrypted Backups**: Encrypt all backup files
- **Secure Storage**: Store backups in secure locations
- **Access Control**: Limit backup access to authorized personnel
- **Regular Testing**: Test backup restoration procedures

## Monitoring & Logging

### Security Logging

Log all security-relevant events:

```typescript
logger.info('Security Event', {
  event: 'api_key_used',
  user_id: userId,
  ip_address: req.ip,
  user_agent: req.get('User-Agent'),
  timestamp: new Date().toISOString()
});
```

### Log Monitoring

- **Real-time Alerts**: Set up alerts for suspicious activities
- **Log Aggregation**: Centralize logs for analysis
- **Retention Policy**: Define appropriate log retention periods

### Security Metrics

Monitor key security metrics:

- Failed login attempts
- Unusual API usage patterns
- Rate limit violations
- Plugin installation/removal events

## Security Testing

### Automated Security Testing

Include security tests in CI/CD:

```typescript
describe('Security Tests', () => {
  it('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE users; --";
    const response = await request(app)
      .get(`/api/users?email=${maliciousInput}`)
      .set('x-api-key', apiKey);
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('validation error');
  });
});
```

### Static Analysis

Use security-focused static analysis tools:

```json
{
  "scripts": {
    "security:audit": "npm audit",
    "security:scan": "semgrep --config=auto src/",
    "security:deps": "snyk test"
  }
}
```

### Penetration Testing

- **Regular Testing**: Conduct penetration testing quarterly
- **Third-party Testing**: Use external security firms
- **Bug Bounty**: Consider bug bounty programs

### Dependency Scanning

Regularly scan for vulnerable dependencies:

```bash
# Check for known vulnerabilities
npm audit

# Continuous monitoring
snyk monitor
```

## Incident Response

### Security Incident Classification

| Severity | Description | Response Time |
|----------|-------------|---------------|
| Critical | System compromise, data breach | 1 hour |
| High | Service disruption, unauthorized access | 4 hours |
| Medium | Security policy violation | 24 hours |
| Low | Suspicious activity, near-miss | 72 hours |

### Incident Response Plan

1. **Detection**: Identify potential security incident
2. **Assessment**: Evaluate severity and impact
3. **Containment**: Limit damage and prevent spread
4. **Eradication**: Remove threat and vulnerabilities
5. **Recovery**: Restore services and data
6. **Lessons Learned**: Document and improve processes

### Emergency Contacts

Maintain updated emergency contact information:

- **Security Team**: security@company.com
- **Legal Team**: legal@company.com
- **PR Team**: pr@company.com
- **Executive Team**: exec@company.com

### Communication Guidelines

- **Internal**: Immediate notification to relevant teams
- **External**: Coordinated communication through PR team
- **Regulatory**: Follow legal requirements for data breach notification
- **Customers**: Transparent communication about impacts

## Security Best Practices Checklist

### Development

- [ ] All inputs validated and sanitized
- [ ] Error messages don't leak sensitive information
- [ ] Secrets not committed to version control
- [ ] Security tests included in test suite
- [ ] Dependencies regularly scanned for vulnerabilities

### Deployment

- [ ] HTTPS enforced in production
- [ ] Security headers properly configured
- [ ] Rate limiting implemented
- [ ] Backup procedures tested
- [ ] Monitoring and logging enabled

### Operations

- [ ] Access logs reviewed regularly
- [ ] Security incidents documented
- [ ] Penetration testing conducted
- [ ] Employee security training current
- [ ] Incident response plan tested

## Security Resources

### Documentation

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Cloudflare Security Best Practices](https://developers.cloudflare.com/fundamentals/security/)
- [Node.js Security Checklist](https://github.com/goldbergyoni/nodebestpractices#-security)

### Tools

- **Snyk**: Dependency vulnerability scanning
- **Semgrep**: Static code analysis
- **OWASP ZAP**: Web application security testing
- **Nessus**: Network vulnerability scanning

### Training

- Security awareness training for all developers
- Secure coding practices
- Incident response training
- Regular security briefings

---

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly:

1. **Email**: security@company.com
2. **PGP Key**: Available on request
3. **Response Time**: We aim to respond within 24 hours
4. **Disclosure**: We coordinate disclosure with researchers

Please do not open public issues for security vulnerabilities.