# Production Troubleshooting Guide

When site works on `localhost` but not on `ghzm.us`.

---

## 🔍 Diagnosis Steps

### Step 1: Open Browser DevTools

1. Open `https://ghzm.us` in browser
2. Press `F12` to open DevTools
3. Go to **Console** tab
4. Try to play a video
5. Check for errors

---

## 🐛 Common Errors & Solutions

### Error 1: CORS Policy Error

**Error Message:**
```
Access to XMLHttpRequest at 'https://be-mov.nicola.id/api/...' 
from origin 'https://ghzm.us' has been blocked by CORS policy
```

**Cause:** Backend CORS tidak allow `ghzm.us`

**Solution:**

```bash
# SSH ke VPS
ssh root@vps

# Update backend
cd /root/Me/nmovie
git pull origin master

# Restart backend
pm2 restart nmovie-backend

# Verify CORS config includes ghzm.us
pm2 logs nmovie-backend --lines 30
```

**Verify CORS config di `server/src/app.js`:**
```javascript
origin: [
    'https://ghzm.us',        // ✅ Must exist
    'http://ghzm.us',
    'https://www.ghzm.us',
    // ...
]
```

---

### Error 2: DNS Not Resolved

**Error Message:**
```
net::ERR_NAME_NOT_RESOLVED
Failed to load resource: net::ERR_NAME_NOT_RESOLVED
URL: https://be-mov.nicola.id/...
```

**Cause:** Subdomain `be-mov.nicola.id` belum ada di DNS

**Solution:**

1. **Add DNS A Record** di DNS provider (Cloudflare/cPanel/dll):
   ```
   Type: A
   Name: be-mov
   Value: 15.235.140.249  (IP VPS kamu)
   TTL: Auto
   ```

2. **Wait for DNS propagation** (5-30 menit)

3. **Test DNS:**
   ```bash
   nslookup be-mov.nicola.id
   # Should return IP: 15.235.140.249
   ```

---

### Error 3: Connection Refused

**Error Message:**
```
net::ERR_CONNECTION_REFUSED
Failed to load resource: net::ERR_CONNECTION_REFUSED
```

**Cause:** Backend tidak running atau tidak accessible

**Solution:**

```bash
# SSH ke VPS
ssh root@vps

# Check backend status
pm2 status

# If not running, start it
cd /root/Me/nmovie/server
pm2 start src/server.js --name nmovie-backend

# Check logs
pm2 logs nmovie-backend

# Test backend
curl http://localhost:7001/health
# Should return: {"status":"ok",...}

# Check if port 7001 is open
sudo netstat -tlnp | grep 7001

# Open firewall
sudo ufw allow 7001
sudo ufw status
```

---

### Error 4: Mixed Content (HTTPS → HTTP)

**Error Message:**
```
Mixed Content: The page at 'https://ghzm.us' was loaded over HTTPS,
but requested an insecure XMLHttpRequest endpoint 
'http://be-mov.nicola.id/...'
```

**Cause:** Frontend HTTPS trying to access HTTP backend

**Solution: Setup Reverse Proxy with SSL**

#### Option A: Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install nginx -y

# Create config
sudo nano /etc/nginx/sites-available/be-mov.nicola.id
```

**Paste this:**
```nginx
server {
    listen 80;
    server_name be-mov.nicola.id;
    
    location / {
        proxy_pass http://localhost:7001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable & restart:**
```bash
sudo ln -s /etc/nginx/sites-available/be-mov.nicola.id /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**Add SSL:**
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d be-mov.nicola.id
```

**Test:**
```bash
curl https://be-mov.nicola.id/health
```

---

### Error 5: 404 Not Found for Routes

**Error:** `/login`, `/search` etc return 404 on reload

**Solution:** Already fixed with `.htaccess` (see DEPLOYMENT_GUIDE.md)

Verify `.htaccess` exists in public_html:
```bash
ssh root@vps
ls -la /path/to/public_html/.htaccess
cat /path/to/public_html/.htaccess
```

---

## ✅ Complete Deployment Checklist

### Backend VPS:

- [ ] DNS A record exists for `be-mov.nicola.id`
- [ ] Backend code updated (`git pull`)
- [ ] Backend running (`pm2 status`)
- [ ] Port 7001 accessible
- [ ] CORS includes `ghzm.us`
- [ ] Reverse proxy configured (Nginx/Apache)
- [ ] SSL certificate installed
- [ ] Health endpoint accessible: `https://be-mov.nicola.id/health`

### Frontend VPS:

- [ ] Latest `dist/` uploaded to server
- [ ] `.htaccess` exists and readable
- [ ] Permissions correct (755 for dirs, 644 for files)
- [ ] Build includes correct API URL (be-mov.nicola.id)

### Browser Tests:

- [ ] Open `https://ghzm.us`
- [ ] No CORS errors in Console
- [ ] No network errors in Network tab
- [ ] Can login/register
- [ ] Can search movies
- [ ] Can play videos

---

## 🧪 Testing Commands

### Test Backend Health:

```bash
# From VPS
curl http://localhost:7001/health

# From anywhere
curl https://be-mov.nicola.id/health

# Expected: {"status":"ok","timestamp":"..."}
```

### Test CORS:

```bash
curl -H "Origin: https://ghzm.us" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS https://be-mov.nicola.id/api/auth/login -v

# Look for:
# < Access-Control-Allow-Origin: https://ghzm.us
```

### Test Login API:

```bash
curl -X POST https://be-mov.nicola.id/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://ghzm.us" \
  -d '{"email":"gmail@nicola.id","password":"1234"}'

# Expected: {"id":1,"email":"...","token":"..."}
```

### Test Streams API:

```bash
curl -X POST https://be-mov.nicola.id/api/scrapers/streams \
  -H "Content-Type: application/json" \
  -d '{"tmdbId":"550","mediaType":"movie","mode":"vidlink"}'

# Expected: {"streams":[...],"errors":[],...}
```

---

## 📊 Monitoring

### View Backend Logs:

```bash
pm2 logs nmovie-backend --lines 50

# Real-time logs
pm2 logs nmovie-backend
```

### View Nginx Logs:

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Check Backend Status:

```bash
pm2 status
pm2 monit
```

---

## 🔧 Quick Fixes

### Reset Everything:

```bash
# Backend
cd /root/Me/nmovie
git pull origin master
pm2 restart nmovie-backend
pm2 logs nmovie-backend

# Check
curl http://localhost:7001/health
curl https://be-mov.nicola.id/health
```

### Clear Browser Cache:

1. Open `https://ghzm.us`
2. Press `Ctrl+Shift+Delete`
3. Clear cache and cookies
4. Reload page (`Ctrl+F5`)

### Restart Services:

```bash
# Backend
pm2 restart nmovie-backend

# Nginx
sudo systemctl restart nginx

# PostgreSQL (if needed)
sudo systemctl restart postgresql
```

---

## 📞 Getting Help

If still not working after all steps:

1. **Collect error logs:**
   ```bash
   pm2 logs nmovie-backend --lines 100 > backend_logs.txt
   sudo tail -100 /var/log/nginx/error.log > nginx_logs.txt
   ```

2. **Browser console errors:**
   - Open DevTools (F12)
   - Console tab
   - Copy all red errors
   - Network tab → Check failed requests

3. **Test URLs:**
   - Frontend: https://ghzm.us
   - Backend health: https://be-mov.nicola.id/health
   - Backend API: https://be-mov.nicola.id/api/auth/login

4. **Share this info for debugging**

---

## 🎯 Expected Working State

After fixing all issues:

✅ **Backend:**
```bash
$ curl https://be-mov.nicola.id/health
{"status":"ok","timestamp":"2024-12-24T..."}
```

✅ **Frontend:**
- Open `https://ghzm.us`
- No console errors
- Can login/register
- Can search movies
- Can play videos

✅ **CORS:**
- No "blocked by CORS policy" errors
- API requests succeed

✅ **SSL:**
- Green padlock in browser
- No mixed content warnings

---

**Quick Deploy Script:** Run `./deploy-production.sh` for automated deployment.

