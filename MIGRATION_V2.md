# Migration Guide: v1.0 to v2.0

This guide helps you upgrade from the previous version to v2.0 with all new features.

## ⚠️ Important: Backup First

```bash
# Backup your database
pg_dump nuvio > backup_$(date +%Y%m%d).sql

# Backup your .env files
cp .env .env.backup
cp server/.env server/.env.backup
```

## Step 1: Update Dependencies

```bash
# Update root dependencies
npm install

# Update server dependencies
cd server
npm install
cd ..
```

## Step 2: Update Environment Variables

### Add to server/.env:
```env
# Logging
LOG_LEVEL=info

# CORS (replace hardcoded domains)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://your-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Step 3: Run Database Migrations

```bash
cd server

# Generate new Prisma client
npx prisma generate

# Run migrations (this will add new tables)
npx prisma migrate dev --name v2_upgrade

# Or for production
npx prisma migrate deploy
```

### New Tables Added:
- `WatchHistory` - Track user viewing progress
- `Notification` - User notifications
- `ActivityLog` - User activity tracking
- `UserDevice` - Device management
- `AdminAction` - Admin audit trail
- `SubscriptionPlan` - Subscription plans
- `AdminAction` - Admin actions log

### Modified Tables:
- `User` - Added fields:
  - `subscriptionPlanId`
  - `lastLoginAt`
  - `lastLoginIp`
- `LibraryItem` - Added cascade delete

## Step 4: Update Code

### If you modified server/src/app.js:
The file now includes:
- Rate limiting middleware
- Winston logger
- Error handling middleware
- New routes for notifications, watch history, user profile

Merge your changes carefully or use the new version.

### If you modified AdminDashboard.tsx:
We've created a new `EnhancedAdminDashboard.tsx`. You can:
- Use the new one (recommended)
- Keep both and switch in App.tsx
- Merge features manually

## Step 5: Create Logs Directory

```bash
mkdir -p server/logs
```

## Step 6: Test the Migration

### 1. Start the servers:
```bash
# Terminal 1
npm run dev

# Terminal 2
npm run server:dev
```

### 2. Test new features:
- ✅ Login and check notifications bell
- ✅ Visit /profile page
- ✅ Watch a video and check /history
- ✅ Check continue watching on homepage
- ✅ Admin: Check new analytics dashboard
- ✅ Admin: Try bulk approve users

### 3. Check logs:
```bash
tail -f server/logs/combined.log
```

## Step 7: Update Production

### For VPS/Server:

```bash
# Pull latest code
git pull origin master

# Install dependencies
npm install
cd server && npm install && cd ..

# Run migrations
cd server
npx prisma migrate deploy
npx prisma generate

# Restart services
pm2 restart all
# or
systemctl restart nuvio-server
systemctl restart nginx
```

### For Docker:

```bash
# Rebuild containers
docker-compose down
docker-compose build
docker-compose up -d

# Run migrations
docker-compose exec server npx prisma migrate deploy
```

## Breaking Changes

### 1. vm2 Removed
If you have custom scrapers using vm2, update to use isolated-vm:

```javascript
// Old (vm2)
const { VM } = require('vm2');
const vm = new VM();

// New (isolated-vm)
const ivm = require('isolated-vm');
const isolate = new ivm.Isolate();
```

### 2. Console.log Replaced with Logger
Update any custom code:

```javascript
// Old
console.log('User logged in');
console.error('Error:', error);

// New
const logger = require('./utils/logger');
logger.info('User logged in');
logger.error('Error:', error);
```

### 3. CORS Configuration
Hardcoded domains moved to environment variables. Update your deployment scripts.

## Rollback Plan

If something goes wrong:

### 1. Restore Database:
```bash
psql nuvio < backup_YYYYMMDD.sql
```

### 2. Restore Code:
```bash
git checkout v1.0  # or your previous version tag
npm install
cd server && npm install
```

### 3. Restore Environment:
```bash
cp .env.backup .env
cp server/.env.backup server/.env
```

## New Features to Announce to Users

### For Users:
- 📊 View your watch history
- ▶️ Continue watching from where you left off
- 🔔 Get notifications for account updates
- 👤 Manage your profile and change password
- 📱 See and manage your devices
- ⏰ See subscription expiry warnings

### For Admins:
- 📈 New analytics dashboard
- 👥 Bulk approve users
- 🔍 Advanced user search and filtering
- 📋 Activity logs for all users
- 🔐 Admin action audit trail
- 📊 Most watched content statistics

## Performance Notes

### Database Indexes
New indexes added for:
- Watch history queries
- Notification lookups
- Activity log searches

### Rate Limiting
Default limits:
- General API: 100 requests per 15 minutes
- Auth endpoints: 5 attempts per 15 minutes
- Scraper proxy: 30 requests per minute

Adjust in server/.env if needed.

## Support

If you encounter issues:

1. Check logs: `server/logs/error.log`
2. Verify database migrations: `npx prisma migrate status`
3. Test API endpoints: Use Postman or curl
4. Check GitHub issues
5. Contact support

## Post-Migration Checklist

- [ ] Database backup created
- [ ] Dependencies updated
- [ ] Environment variables configured
- [ ] Migrations run successfully
- [ ] Logs directory created
- [ ] Frontend builds without errors
- [ ] Backend starts without errors
- [ ] Login/Register works
- [ ] Watch history tracking works
- [ ] Notifications appear
- [ ] Admin dashboard loads
- [ ] Bulk approve works
- [ ] Production deployed
- [ ] Users notified of new features

## Optional: Seed Subscription Plans

```bash
cd server
npx prisma studio
```

Add plans in SubscriptionPlan table:
- Basic: 1 month, $9.99
- Standard: 3 months, $24.99
- Premium: 12 months, $89.99

## Monitoring After Migration

### First 24 Hours:
- Monitor error logs closely
- Check database performance
- Watch for rate limit hits
- Verify notification delivery

### First Week:
- Gather user feedback
- Monitor watch history growth
- Check analytics accuracy
- Optimize slow queries if needed

## Success Metrics

After migration, you should see:
- ✅ Zero critical errors in logs
- ✅ Users receiving notifications
- ✅ Watch history being tracked
- ✅ Admin dashboard showing data
- ✅ No performance degradation
- ✅ All tests passing

---

**Migration completed successfully? Great! Enjoy the new features! 🎉**
