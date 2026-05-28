# Nuvio Web - Complete Setup Guide

## Recent Updates (v2.0)

### Security Improvements
- ✅ Replaced deprecated `vm2` with `isolated-vm`
- ✅ Added rate limiting for all API endpoints
- ✅ Implemented Winston logger for better error tracking
- ✅ Removed production sourcemaps
- ✅ Added CORS environment configuration

### New User Features
- ✅ User profile page with subscription status
- ✅ Password change functionality
- ✅ Watch history tracking
- ✅ Continue watching section on homepage
- ✅ Real-time notifications with bell icon
- ✅ Device management
- ✅ Subscription expiry warnings

### New Admin Features
- ✅ Analytics dashboard with key metrics
- ✅ Bulk user approval
- ✅ Advanced user search and filtering
- ✅ Activity logs tracking
- ✅ Admin action audit trail
- ✅ Most watched content statistics

### Database Schema Updates
- ✅ Watch history table
- ✅ Notifications table
- ✅ Activity logs table
- ✅ User devices table
- ✅ Admin actions table
- ✅ Subscription plans table

## Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL 12+
- TMDB API Key (free from https://www.themoviedb.org/)

## Installation

### 1. Clone and Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb nuvio

# Or using psql
psql -U postgres
CREATE DATABASE nuvio;
\q
```

### 3. Environment Configuration

#### Frontend (.env)
```env
VITE_TMDB_API_KEY=your_tmdb_api_key_here
VITE_API_URL=http://localhost:7001/api
VITE_PROVIDER_URL=https://raw.githubusercontent.com/tapframe/nuvio-providers/refs/heads/main
VITE_APP_NAME=Nuvio
VITE_APP_VERSION=2.0.0
```

#### Backend (server/.env)
```env
PORT=7001
NODE_ENV=development
LOG_LEVEL=info

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/nuvio"

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your_jwt_secret_here

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Database Migration

```bash
cd server
npx prisma generate
npx prisma migrate dev --name init
cd ..
```

### 5. Start Development Servers

```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run server:dev
```

## Production Deployment

### 1. Build Frontend

```bash
npm run build
```

### 2. Setup Production Environment

```bash
# Server environment
cd server
cp .env.example .env
# Edit .env with production values

# Run migrations
npx prisma migrate deploy
```

### 3. Start Production Server

```bash
cd server
npm start
```

### 4. Serve Frontend

Use Nginx, Apache, or any static file server to serve the `dist` directory.

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/nuvio/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:7001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## First Time Setup

1. **Create Admin Account**: The first user to register will automatically become an admin.

2. **Configure Subscription Plans** (Optional): Use Prisma Studio to add subscription plans:
```bash
cd server
npx prisma studio
```

3. **Test User Flow**:
   - Register a new user
   - Login as admin
   - Approve the user from admin dashboard
   - Test streaming functionality

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update profile

### User
- `GET /api/user/profile` - Get full profile
- `PUT /api/user/profile` - Update profile
- `POST /api/user/change-password` - Change password
- `GET /api/user/devices` - Get user devices
- `DELETE /api/user/devices/:id` - Remove device

### Watch History
- `GET /api/watch-history` - Get watch history
- `GET /api/watch-history/continue` - Get continue watching
- `POST /api/watch-history/progress` - Update watch progress
- `GET /api/watch-history/progress/:tmdbId` - Get specific progress
- `DELETE /api/watch-history` - Clear history

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

### Admin
- `GET /api/admin/analytics` - Get dashboard analytics
- `GET /api/admin/users` - Get all users (with filters)
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id/status` - Update user status
- `POST /api/admin/users/bulk-approve` - Bulk approve users
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/activity-logs` - Get activity logs
- `GET /api/admin/admin-actions` - Get admin actions

### Library
- `GET /api/library` - Get user library
- `POST /api/library` - Add to library
- `DELETE /api/library/:tmdbId` - Remove from library

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U postgres -d nuvio
```

### Port Already in Use
```bash
# Find process using port 7001
lsof -i :7001
# Kill process
kill -9 <PID>
```

### Migration Errors
```bash
# Reset database (WARNING: deletes all data)
cd server
npx prisma migrate reset

# Or create new migration
npx prisma migrate dev --name fix_schema
```

### Rate Limiting Issues
Adjust rate limits in `server/.env`:
```env
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=200  # Increase if needed
```

## Monitoring

### View Logs
```bash
# Server logs
tail -f server/logs/combined.log
tail -f server/logs/error.log
```

### Database Monitoring
```bash
cd server
npx prisma studio
```

## Security Best Practices

1. **Never commit .env files** - Already in .gitignore
2. **Use strong JWT secrets** - Generate with `openssl rand -base64 32`
3. **Enable HTTPS in production** - Use Let's Encrypt
4. **Regular backups** - Backup PostgreSQL database daily
5. **Update dependencies** - Run `npm audit` regularly
6. **Monitor logs** - Check error logs for suspicious activity

## Performance Optimization

1. **Enable caching** - Add Redis for session management
2. **CDN for static assets** - Use Cloudflare or similar
3. **Database indexing** - Already optimized in schema
4. **Compress responses** - Enable gzip in Nginx
5. **Lazy loading** - Already implemented in frontend

## Support

- Documentation: Check all .md files in root directory
- Issues: Open GitHub issue
- Email: support@your-domain.com

## License

MIT License - See LICENSE file for details
