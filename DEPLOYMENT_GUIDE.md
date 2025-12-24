# Deployment Guide - NMovie

Panduan deploy NMovie ke production server (LiteSpeed/Apache/Nginx).

---

## 🚀 Deploy Frontend ke LiteSpeed/Apache

### Problem: 404 Error saat Reload di Route Tertentu

Ketika kamu reload halaman di `/login` atau route lain, server mencari file `login.html` yang tidak ada. 

**Solusi:** Redirect semua requests ke `index.html` agar React Router bisa handle routing.

---

## ✅ Solution: .htaccess File

File `.htaccess` sudah dibuat di:
- `public/.htaccess` (akan ter-copy ke `dist/` saat build)
- `dist/.htaccess` (backup, jika public/ tidak ter-copy)

### Isi `.htaccess`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Don't rewrite files or directories
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  
  # Rewrite everything else to index.html to allow HTML5 state links
  RewriteRule ^ index.html [L]
</IfModule>
```

**Penjelasan:**
- `RewriteCond %{REQUEST_FILENAME} !-f` → Jangan rewrite jika file exists (CSS, JS, images)
- `RewriteCond %{REQUEST_FILENAME} !-d` → Jangan rewrite jika directory exists
- `RewriteRule ^ index.html [L]` → Semua request lain → redirect ke index.html

---

## 📦 Deploy Steps

### Method 1: Build & Upload Manual

```bash
# 1. Build production
npm run build

# 2. Upload dist/ folder ke VPS
scp -r dist/* user@your-vps:/path/to/public_html/

# 3. Pastikan .htaccess ada di root folder
ssh user@your-vps
cd /path/to/public_html/
ls -la .htaccess  # Should exist

# 4. Set permissions
chmod 644 .htaccess
chmod -R 755 .
```

### Method 2: Git Pull + Build di Server

```bash
# 1. SSH ke VPS
ssh user@your-vps

# 2. Clone/Pull repository
cd /path/to/
git clone git@github.com:nicolaananda/nmovie.git
# atau jika sudah ada:
cd nmovie && git pull origin master

# 3. Build
npm install
npm run build

# 4. Copy ke public_html
cp -r dist/* /path/to/public_html/
cp dist/.htaccess /path/to/public_html/.htaccess

# 5. Set permissions
cd /path/to/public_html/
chmod 644 .htaccess
chmod -R 755 .
```

---

## 🔧 LiteSpeed Specific Configuration

### Enable mod_rewrite di LiteSpeed

1. **Via LiteSpeed WebAdmin Console:**
   - Go to: Configuration → Server → General
   - Enable: "Allow Override" → All
   - Restart LiteSpeed

2. **Via .htaccess (Already Done):**
   - File `.htaccess` sudah include `RewriteEngine On`

### LiteSpeed Cache Plugin (Optional)

Jika pakai LiteSpeed Cache, tambahkan di `.htaccess`:

```apache
<IfModule LiteSpeed>
  # Cache static assets
  CacheLookup public on
  
  # Don't cache HTML (for dynamic content)
  <FilesMatch "\.(html)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
  </FilesMatch>
</IfModule>
```

---

## 🌐 Alternative: Nginx Configuration

Jika pakai Nginx instead of LiteSpeed/Apache:

### Create/Edit nginx.conf:

```nginx
server {
    listen 80;
    server_name ghzm.us www.ghzm.us;
    
    root /path/to/public_html;
    index index.html;
    
    # Enable gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # SPA fallback - redirect all to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Reload Nginx:
```bash
sudo nginx -t  # Test config
sudo systemctl reload nginx
```

---

## 🔒 SSL/HTTPS Setup (Recommended)

### LiteSpeed/Apache with Certbot:

```bash
# 1. Install Certbot
sudo apt install certbot python3-certbot-apache -y

# 2. Get SSL certificate
sudo certbot --apache -d ghzm.us -d www.ghzm.us

# 3. Auto-renewal test
sudo certbot renew --dry-run
```

### Update .htaccess untuk Force HTTPS:

```apache
# Force HTTPS
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>
```

---

## 📝 Environment Variables di Production

### Option 1: Build dengan .env Production

```bash
# Create .env.production
cat > .env.production << 'EOF'
VITE_API_URL=https://be-mov.nicola.id/api
VITE_SCRAPER_PROXY_URL=https://be-mov.nicola.id
VITE_TMDB_API_KEY=your_tmdb_api_key
EOF

# Build dengan production env
npm run build
```

### Option 2: Runtime Environment (Advanced)

Jika butuh dynamic env variables tanpa rebuild, gunakan `env.js`:

```bash
# Create env.js di public/
cat > public/env.js << 'EOF'
window.env = {
  VITE_API_URL: 'https://be-mov.nicola.id/api',
  VITE_SCRAPER_PROXY_URL: 'https://be-mov.nicola.id',
};
EOF
```

Load di `index.html`:
```html
<script src="/env.js"></script>
```

---

## 🧪 Test Deployment

### 1. Test .htaccess Working:

```bash
# Test dari browser atau curl
curl -I https://ghzm.us/login
# Should return 200, not 404

# Test reload di berbagai routes
# https://ghzm.us/
# https://ghzm.us/login
# https://ghzm.us/register
# https://ghzm.us/search
# Semua harus load tanpa 404
```

### 2. Test Static Assets Loading:

```bash
# Check browser console (F12)
# Tidak boleh ada 404 untuk CSS/JS files
```

### 3. Test API Connection:

```bash
# Di browser console
fetch('https://be-mov.nicola.id/health')
  .then(r => r.json())
  .then(d => console.log('API OK:', d))
```

---

## 🐛 Troubleshooting

### Problem: Still getting 404 on reload

**Solution 1:** Check `.htaccess` exists and readable
```bash
ssh user@vps
cd /path/to/public_html/
ls -la .htaccess
cat .htaccess  # Verify content
chmod 644 .htaccess
```

**Solution 2:** Enable mod_rewrite
```bash
# Apache
sudo a2enmod rewrite
sudo systemctl restart apache2

# Check if enabled
apache2ctl -M | grep rewrite
```

**Solution 3:** Check AllowOverride in Apache config
```bash
sudo nano /etc/apache2/sites-available/000-default.conf

# Add/modify:
<Directory /path/to/public_html/>
    AllowOverride All
</Directory>

sudo systemctl restart apache2
```

### Problem: .htaccess not working (LiteSpeed)

**Solution:** Enable in LiteSpeed WebAdmin
- Configuration → Virtual Hosts → [Your Site] → General
- Set "Allow Override" → All
- Graceful Restart

### Problem: CSS/JS not loading after deployment

**Solution:** Check base path in `index.html`
```html
<!-- Should be: -->
<script type="module" src="/assets/index-xxx.js"></script>

<!-- Not: -->
<script type="module" src="./assets/index-xxx.js"></script>
```

Update vite.config.ts if needed:
```typescript
export default defineConfig({
  base: '/', // Ensure base is /
  // ... rest of config
})
```

### Problem: API CORS errors in production

**Solution:** Verify backend CORS includes your domain
```javascript
// server/src/app.js
origin: [
  'https://ghzm.us',
  'https://www.ghzm.us',
  // ...
],
```

---

## 📊 Performance Optimization

### 1. Enable Compression (.htaccess already includes this)

```apache
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript
</IfModule>
```

### 2. Enable Caching

```apache
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType image/png "access plus 1 year"
</IfModule>
```

### 3. Preload Critical Assets

Add to `index.html`:
```html
<link rel="preload" href="/assets/index.js" as="script">
<link rel="preload" href="/assets/index.css" as="style">
```

---

## 🚀 Deployment Checklist

- [ ] `.htaccess` file created dan uploaded
- [ ] `npm run build` completed successfully
- [ ] `dist/` folder uploaded ke server
- [ ] `.htaccess` permissions set to 644
- [ ] mod_rewrite enabled (Apache) or allowed (LiteSpeed)
- [ ] Test reload di semua routes (no 404)
- [ ] Static assets loading (CSS, JS, images)
- [ ] API connection working
- [ ] SSL/HTTPS enabled
- [ ] CORS configured for production domain
- [ ] Environment variables set correctly

---

## 📚 Related Files

- **public/.htaccess** - Source .htaccess file
- **dist/.htaccess** - Built .htaccess file
- **.env.example** - Environment variables template
- **POSTGRESQL_VPS_SETUP.md** - Backend setup guide

---

## 💡 Quick Commands Summary

```bash
# Build
npm run build

# Upload (SCP)
scp -r dist/* user@vps:/path/to/public_html/

# Upload (RSYNC - Better for updates)
rsync -avz --delete dist/ user@vps:/path/to/public_html/

# Check .htaccess
ssh user@vps 'cat /path/to/public_html/.htaccess'

# Set permissions
ssh user@vps 'cd /path/to/public_html && chmod 644 .htaccess && chmod -R 755 .'

# Test
curl -I https://ghzm.us/login
```

---

**🎯 Expected Result:**

After deployment:
- ✅ `https://ghzm.us/` loads correctly
- ✅ `https://ghzm.us/login` loads correctly (no 404 on reload)
- ✅ All routes accessible via direct URL
- ✅ Static assets cached properly
- ✅ API calls working
- ✅ No console errors

**Need Help?** Check server error logs:
```bash
# Apache/LiteSpeed
sudo tail -f /usr/local/lsws/logs/error.log
sudo tail -f /var/log/apache2/error.log
```

