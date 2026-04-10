# VPS Deployment Guide - ghzm.us

## Prerequisites

Your VPS should have:
- Ubuntu 20.04+ or similar Linux distribution
- Node.js 18+ installed
- PostgreSQL 12+ installed
- Nginx installed
- Domain ghzm.us pointing to your VPS IP

## Step 1: Initial VPS Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y nginx postgresql postgresql-contrib git curl

# Install Node.js 18+ (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install build tools (for native modules)
sudo apt install -y build-essential python3
```

## Step 2: Setup PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE nuvio_db;
CREATE USER nuvio_user WITH ENCRYPTED PASSWORD 'your_strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE nuvio_db TO nuvio_user;
\q

# Test connection
psql -U nuvio_user -d nuvio_db -h localhost
# Enter password when prompted
# Type \q to exit
```

## Step 3: Clone Repository

```bash
# Navigate to your home directory
cd ~

# Create directory structure
mkdir -p se
cd se

# Clone your repository
git clone https://github.com/yourusername/nmovie.git
cd nmovie

# Or if already cloned, pull latest
git pull origin master
```

## Step 4: Configure Environment Variables

### Backend Environment (.env)

```bash
# Create server/.env
nano server/.env
```

Add the following (update values):

```env
PORT=7001
NODE_ENV=production
LOG_LEVEL=info

# Database
DATABASE_URL="postgresql://nuvio_user:your_strong_password_here@localhost:5432/nuvio_db"

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your_generated_jwt_secret_here

# CORS Origins
CORS_ORIGINS=https://ghzm.us,https://www.ghzm.us

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Environment (.env)

```bash
# Create .env
nano .env
```

Add the following:

```env
# TMDB API Key
VITE_TMDB_API_KEY=your_tmdb_api_key_here

# API URL (production)
VITE_API_URL=https://ghzm.us/api

# Provider URL
VITE_PROVIDER_URL=https://raw.githubusercontent.com/tapframe/nuvio-providers/refs/heads/main

# App Info
VITE_APP_NAME=Nuvio
VITE_APP_VERSION=2.0.0
```

## Step 5: Setup SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot certonly --nginx -d ghzm.us -d www.ghzm.us

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose whether to share email

# Certificates will be saved to:
# /etc/letsencrypt/live/ghzm.us/
```

## Step 6: Configure Nginx

```bash
# Copy nginx configuration
sudo cp nginx-ghzm.us.conf /etc/nginx/sites-available/ghzm.us

# Create symbolic link
sudo ln -s /etc/nginx/sites-available/ghzm.us /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx

# Enable nginx to start on boot
sudo systemctl enable nginx
```

## Step 7: Deploy Application

```bash
# Make sure you're in the project directory
cd ~/se/nmovie

# Run production start script
./start-prod.sh

# For first time setup with auto-start on boot:
./start-prod.sh --setup-startup

# If prompted, run the PM2 startup command shown
```

## Step 8: Verify Deployment

```bash
# Check PM2 status
pm2 status

# Check backend logs
pm2 logs nuvio-server

# Check if backend is responding
curl http://localhost:7001/health

# Check Nginx status
sudo systemctl status nginx

# Check Nginx logs
sudo tail -f /var/log/nginx/ghzm.us-access.log
sudo tail -f /var/log/nginx/ghzm.us-error.log
```

## Step 9: Test Your Website

Open your browser and visit:
- https://ghzm.us

You should see your Nuvio application!

## Step 10: Setup Auto-Renewal for SSL

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically sets up a cron job for renewal
# Verify it's there:
sudo systemctl status certbot.timer
```

## Useful Commands

### PM2 Management
```bash
# View status
pm2 status

# View logs
pm2 logs nuvio-server

# Restart server
pm2 restart nuvio-server

# Stop server
pm2 stop nuvio-server

# Monitor resources
pm2 monit

# Save PM2 configuration
pm2 save
```

### Nginx Management
```bash
# Test configuration
sudo nginx -t

# Reload (without downtime)
sudo systemctl reload nginx

# Restart
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/ghzm.us-access.log
sudo tail -f /var/log/nginx/ghzm.us-error.log
```

### Database Management
```bash
# Connect to database
psql -U nuvio_user -d nuvio_db -h localhost

# Backup database
pg_dump -U nuvio_user -d nuvio_db > backup_$(date +%Y%m%d).sql

# Restore database
psql -U nuvio_user -d nuvio_db < backup_20260411.sql
```

### Application Updates
```bash
# Pull latest code
cd ~/se/nmovie
git pull origin master

# Rebuild and restart
./start-prod.sh --fresh

# Or manually:
npm install
npm run build
cd server && npm install && cd ..
pm2 restart nuvio-server
```

## Troubleshooting

### Backend won't start
```bash
# Check logs
pm2 logs nuvio-server --lines 100

# Check if port 7001 is in use
sudo lsof -i :7001

# Check environment variables
cd server && cat .env
```

### Frontend shows blank page
```bash
# Check if build exists
ls -la dist/

# Rebuild frontend
npm run build

# Check Nginx logs
sudo tail -f /var/log/nginx/ghzm.us-error.log
```

### Database connection error
```bash
# Test database connection
psql -U nuvio_user -d nuvio_db -h localhost

# Check PostgreSQL status
sudo systemctl status postgresql

# Check DATABASE_URL in server/.env
```

### SSL certificate issues
```bash
# Check certificate
sudo certbot certificates

# Renew manually
sudo certbot renew

# Check Nginx SSL configuration
sudo nginx -t
```

## Security Checklist

- [ ] Strong PostgreSQL password set
- [ ] JWT_SECRET generated and set
- [ ] Firewall configured (UFW)
- [ ] SSH key authentication enabled
- [ ] Root login disabled
- [ ] Fail2ban installed (optional)
- [ ] Regular backups scheduled
- [ ] SSL certificate auto-renewal working
- [ ] Nginx security headers configured
- [ ] Application logs monitored

## Firewall Setup (UFW)

```bash
# Install UFW
sudo apt install -y ufw

# Allow SSH (IMPORTANT: Do this first!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Monitoring Setup (Optional)

```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Setup log rotation for application logs
sudo nano /etc/logrotate.d/nuvio
```

Add:
```
/home/nicola/se/nmovie/server/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    create 0644 nicola nicola
}
```

## Backup Script

Create `~/backup-nuvio.sh`:

```bash
#!/bin/bash
BACKUP_DIR=~/backups/nuvio
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U nuvio_user -d nuvio_db > $BACKUP_DIR/db_$DATE.sql

# Backup .env files
cp ~/se/nmovie/server/.env $BACKUP_DIR/server_env_$DATE
cp ~/se/nmovie/.env $BACKUP_DIR/client_env_$DATE

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*_env_*" -mtime +7 -delete

echo "Backup completed: $DATE"
```

Make executable and add to crontab:
```bash
chmod +x ~/backup-nuvio.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add line:
0 2 * * * /home/nicola/backup-nuvio.sh >> /home/nicola/backup.log 2>&1
```

## Support

If you encounter issues:
1. Check application logs: `pm2 logs nuvio-server`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/ghzm.us-error.log`
3. Check database connection
4. Review SECURITY_NOTES.md
5. Check firewall settings

---

**Deployment Date:** 2026-04-11  
**Version:** 2.0.0  
**Domain:** ghzm.us
