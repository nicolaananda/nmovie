# Security Notes - Nuvio v2.0

## Known Security Considerations

### 1. Scraper Execution (If Using vm2)

**Status:** ⚠️ Requires Attention

If your scraper proxy uses `vm2` for executing scraper code, please note:
- `vm2` is deprecated and has known security vulnerabilities
- Only use in trusted environments
- Do not allow untrusted users to upload/execute scrapers

**Recommended Solutions:**

#### Option A: Remove Scraper Execution (Recommended)
If you don't need dynamic scraper execution, remove the vm2 dependency entirely and use static scrapers.

#### Option B: Use Subprocess Isolation
Execute scrapers in separate Node.js processes:

```javascript
const { spawn } = require('child_process');

function executeScraper(scraperCode, url) {
    return new Promise((resolve, reject) => {
        const child = spawn('node', ['-e', scraperCode], {
            timeout: 30000,
            env: { URL: url }
        });
        
        let output = '';
        child.stdout.on('data', (data) => output += data);
        child.on('close', (code) => {
            if (code === 0) resolve(JSON.parse(output));
            else reject(new Error('Scraper failed'));
        });
    });
}
```

#### Option C: Use Docker Containers
Run scrapers in isolated Docker containers for maximum security.

### 2. Rate Limiting

**Status:** ✅ Implemented

Rate limiting is now active on all endpoints:
- General API: 100 requests per 15 minutes
- Auth endpoints: 5 attempts per 15 minutes
- Scraper proxy: 30 requests per minute

Adjust in `server/.env` if needed:
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. JWT Secret

**Status:** ⚠️ Action Required

Generate a strong JWT secret:

```bash
openssl rand -base64 32
```

Add to `server/.env`:
```env
JWT_SECRET=your_generated_secret_here
```

**Never commit this to git!**

### 4. Database Security

**Status:** ✅ Good Practices

- Use strong PostgreSQL passwords
- Limit database user permissions
- Enable SSL for production connections
- Regular backups

Example secure connection string:
```env
DATABASE_URL="postgresql://user:strong_password@localhost:5432/nuvio?sslmode=require"
```

### 5. CORS Configuration

**Status:** ✅ Implemented

CORS origins are now environment-based. Update `server/.env`:

```env
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 6. Input Validation

**Status:** ⚠️ Partial

Current validation:
- ✅ JWT token validation
- ✅ User authentication
- ⚠️ Limited input sanitization

**Recommendations:**
- Add input validation library (e.g., `joi`, `express-validator`)
- Sanitize all user inputs
- Validate file uploads if implemented

### 7. SQL Injection

**Status:** ✅ Protected

Using Prisma ORM which provides:
- Parameterized queries
- Type safety
- Automatic escaping

### 8. XSS Protection

**Status:** ⚠️ Frontend Responsibility

React provides some XSS protection, but:
- Never use `dangerouslySetInnerHTML` with user content
- Sanitize user-generated content
- Use Content Security Policy headers

### 9. HTTPS/SSL

**Status:** ⚠️ Production Required

**For Production:**
- Use HTTPS only
- Redirect HTTP to HTTPS
- Use Let's Encrypt for free SSL certificates

Nginx example:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # ... rest of config
}
```

### 10. Environment Variables

**Status:** ⚠️ Action Required

**Never commit:**
- `.env` files
- API keys
- Database credentials
- JWT secrets

**Always:**
- Use `.env.example` as template
- Add `.env` to `.gitignore` (already done)
- Use different secrets for dev/staging/production

### 11. Dependency Vulnerabilities

**Status:** ⚠️ Regular Maintenance Required

Run regularly:
```bash
npm audit
npm audit fix
```

Current known vulnerabilities:
- Check with `npm audit` in both root and server directories

### 12. Logging

**Status:** ✅ Implemented

Winston logger now tracks:
- All API requests
- Errors with stack traces
- User activities
- Admin actions

**Security Note:**
- Don't log sensitive data (passwords, tokens)
- Rotate log files regularly
- Secure log file access

### 13. Session Management

**Status:** ✅ Good

- JWT tokens with 30-day expiry
- Tokens stored in localStorage (client-side)
- No server-side session storage needed

**Recommendations:**
- Implement token refresh mechanism
- Add token blacklist for logout
- Consider shorter expiry times

### 14. File Upload Security

**Status:** N/A (Not Implemented)

If you add file uploads:
- Validate file types
- Limit file sizes
- Scan for malware
- Store outside web root
- Use unique filenames

## Security Checklist for Production

- [ ] Generate strong JWT secret
- [ ] Use HTTPS only
- [ ] Configure CORS properly
- [ ] Set strong database password
- [ ] Enable database SSL
- [ ] Remove or secure scraper execution
- [ ] Set up firewall rules
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity
- [ ] Set up automated backups
- [ ] Implement rate limiting (already done)
- [ ] Add input validation
- [ ] Set up monitoring/alerting
- [ ] Review and update dependencies
- [ ] Implement CSP headers
- [ ] Add security headers (helmet.js)

## Recommended Security Headers

Add to Express app:

```bash
npm install helmet
```

```javascript
const helmet = require('helmet');
app.use(helmet());
```

## Security Monitoring

Consider implementing:
- Fail2ban for brute force protection
- Log monitoring (ELK stack, Grafana)
- Intrusion detection (OSSEC, Snort)
- Uptime monitoring (UptimeRobot, Pingdom)

## Incident Response

If you detect a security breach:
1. Immediately revoke all JWT tokens
2. Force password reset for all users
3. Review logs for unauthorized access
4. Patch the vulnerability
5. Notify affected users
6. Document the incident

## Contact

For security issues, please email: security@yourdomain.com

**Do not open public GitHub issues for security vulnerabilities.**

---

Last Updated: 2026-04-11
Version: 2.0.0
