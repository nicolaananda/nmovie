# 🚀 Quick Deployment Reference - ghzm.us

## On Your VPS (ghzm.us)

### 1. First Time Setup (One-time)

```bash
# SSH to your VPS
ssh user@ghzm.us

# Clone repository
cd ~
mkdir -p se && cd se
git clone https://github.com/nicolaananda/nmovie.git
cd nmovie

# Setup PostgreSQL database
sudo -u postgres psql
CREATE DATABASE nuvio_db;
CREATE USER nuvio_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE nuvio_db TO nuvio_user;
\q

# Generate JWT secret
openssl rand -base64 32

# Create environment files
nano server/.env
# Add: DATABASE_URL, JWT_SECRET, CORS_ORIGINS

nano .env
# Add: VITE_TMDB_API_KEY, VITE_API_URL=https://ghzm.us/api

# Setup SSL certificate
sudo certbot certonly --nginx -d ghzm.us -d www.ghzm.us

# Configure Nginx
sudo cp nginx-ghzm.us.conf /etc/nginx/sites-available/ghzm.us
sudo ln -s /etc/nginx/sites-available/ghzm.us /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Deploy application
./start-prod.sh --setup-startup
```

### 2. Regular Updates

```bash
# SSH to VPS
ssh user@ghzm.us

# Navigate to project
cd ~/se/nmovie

# Pull latest changes
git pull origin master

# Redeploy
./start-prod.sh
```

### 3. Quick Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs nuvio-server

# Restart
pm2 restart nuvio-server

# Monitor
pm2 monit

# Nginx reload
sudo systemctl reload nginx
```

## Environment Variables Checklist

### server/.env
```env
PORT=7001
NODE_ENV=production
DATABASE_URL="postgresql://nuvio_user:password@localhost:5432/nuvio_db"
JWT_SECRET=<generated_secret>
CORS_ORIGINS=https://ghzm.us,https://www.ghzm.us
```

### .env
```env
VITE_TMDB_API_KEY=<your_tmdb_key>
VITE_API_URL=https://ghzm.us/api
VITE_APP_NAME=Nuvio
VITE_APP_VERSION=2.0.0
```

## Troubleshooting

### Backend not responding
```bash
pm2 logs nuvio-server --lines 50
pm2 restart nuvio-server
```

### Frontend blank page
```bash
cd ~/se/nmovie
npm run build
sudo systemctl reload nginx
```

### Database error
```bash
psql -U nuvio_user -d nuvio_db -h localhost
# Check connection
```

### SSL certificate
```bash
sudo certbot certificates
sudo certbot renew
```

## URLs

- **Frontend:** https://ghzm.us
- **Backend API:** https://ghzm.us/api
- **Health Check:** https://ghzm.us/health

## Important Files

- **Nginx Config:** `/etc/nginx/sites-available/ghzm.us`
- **SSL Certs:** `/etc/letsencrypt/live/ghzm.us/`
- **App Logs:** `~/se/nmovie/server/logs/`
- **Nginx Logs:** `/var/log/nginx/ghzm.us-*.log`

## Support

Full documentation:
- `VPS_DEPLOYMENT.md` - Complete deployment guide
- `SETUP_GUIDE.md` - Setup instructions
- `SECURITY_NOTES.md` - Security checklist
- `UPGRADE_COMPLETE.md` - Feature summary

---

**Version:** 2.0.0  
**Last Updated:** 2026-04-11
