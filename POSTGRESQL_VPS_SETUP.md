# PostgreSQL Setup untuk VPS (Ubuntu/Debian)

Panduan lengkap setup PostgreSQL di VPS untuk NMovie backend.

---

## 🚀 Quick Setup (Copy-Paste Ready)

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# 3. Check PostgreSQL status
sudo systemctl status postgresql

# 4. Start PostgreSQL (jika belum running)
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

---

## 📦 Step-by-Step Setup

### 1. Install PostgreSQL

```bash
# Update package list
sudo apt update

# Install PostgreSQL dan tools
sudo apt install postgresql postgresql-contrib -y

# Verify installation
psql --version
# Output: psql (PostgreSQL) 14.x atau 15.x
```

### 2. Konfigurasi PostgreSQL User & Database

```bash
# Switch ke postgres user
sudo -i -u postgres

# Masuk ke PostgreSQL console
psql

# Sekarang kamu di PostgreSQL console (postgres=#)
```

**Di dalam PostgreSQL console, jalankan:**

```sql
-- Create database untuk NMovie
CREATE DATABASE nuvio_db;

-- Create user dengan password
CREATE USER nmovie_admin WITH ENCRYPTED PASSWORD 'YourStrongPassword123!';

-- Grant privileges ke user
GRANT ALL PRIVILEGES ON DATABASE nuvio_db TO nmovie_admin;

-- Connect ke database nuvio_db
\c nuvio_db

-- Grant schema privileges (PENTING untuk Prisma!)
GRANT ALL ON SCHEMA public TO nmovie_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nmovie_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO nmovie_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO nmovie_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO nmovie_admin;

-- Verify user dan database
\l          -- List databases
\du         -- List users

-- Exit PostgreSQL console
\q

-- Exit dari postgres user
exit
```

### 3. Enable Remote Access (Jika Backend di VPS Lain)

**⚠️ Skip ini jika backend dan PostgreSQL di VPS yang sama (gunakan localhost)**

Edit `postgresql.conf`:
```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
# Atau untuk PostgreSQL 15:
# sudo nano /etc/postgresql/15/main/postgresql.conf

# Find dan ubah line ini:
# listen_addresses = 'localhost'
# Menjadi:
listen_addresses = '*'

# Save: Ctrl+O, Enter, Ctrl+X
```

Edit `pg_hba.conf` untuk allow remote connections:
```bash
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Tambahkan line ini di bagian bawah:
# Untuk production, ganti 0.0.0.0/0 dengan IP server backend kamu
host    nuvio_db    nmovie_admin    0.0.0.0/0    md5
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

### 4. Konfigurasi Firewall (UFW)

```bash
# Check firewall status
sudo ufw status

# Jika inactive, enable dulu
sudo ufw enable

# Allow SSH (PENTING! Jangan lupa atau kamu terkunci!)
sudo ufw allow 22

# Allow port backend (7001)
sudo ufw allow 7001

# Allow PostgreSQL (jika remote access)
sudo ufw allow 5432

# Reload firewall
sudo ufw reload

# Check status
sudo ufw status numbered
```

### 5. Test Connection dari Local

```bash
# Test connection (ganti YOUR_VPS_IP dengan IP VPS kamu)
psql -h YOUR_VPS_IP -U nmovie_admin -d nuvio_db -W

# Masukkan password saat diminta
# Jika berhasil, kamu masuk ke PostgreSQL console

# Exit
\q
```

---

## 🔧 Konfigurasi Backend NMovie

### 1. Update `.env` di Server VPS

SSH ke VPS dan edit `.env`:

```bash
cd /path/to/NMovie/server

# Edit .env file
nano .env
```

**Isi file `.env`:**

```env
# Database Configuration
DATABASE_URL="postgresql://nmovie_admin:YourStrongPassword123!@localhost:5432/nuvio_db?schema=public"

# Jika PostgreSQL di server lain:
# DATABASE_URL="postgresql://nmovie_admin:YourStrongPassword123!@VPS_IP:5432/nuvio_db?schema=public"

# Server Configuration
PORT=7001

# JWT Secret (ganti dengan random string yang kuat!)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Subtitle Addon URL
SUBSOURCE_ADDON_URL="https://subsource.strem.top/c2tfY2ViN2ZhMWNiZjI4MTgyOTE2MGM5ZWQ4MDg0MGVlNGE2NDMxYjU4ZjEzM2RmYTZjNGI5ZGRlOTAwZWFkNmM4OS9pbmRvbmVzaWFuLGVuZ2xpc2gvaGlJbmNsdWRlL3R5cGU6MC8="
```

### 2. Install Dependencies

```bash
cd /path/to/NMovie/server

# Install Node.js jika belum (recommended: v18 or v20)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node -v
npm -v

# Install dependencies
npm install

# Install Prisma CLI globally (optional)
npm install -g prisma
```

### 3. Setup Prisma & Run Migrations

```bash
cd /path/to/NMovie/server

# Generate Prisma Client
npx prisma generate

# Run migrations (create tables)
npx prisma migrate deploy

# Atau jika development:
npx prisma migrate dev

# Check database
npx prisma studio
# Akan open browser di http://localhost:5555 untuk manage database
```

### 4. Create Admin User (Manual)

```bash
# Masuk ke PostgreSQL
sudo -i -u postgres
psql -d nuvio_db
```

```sql
-- Insert admin user
-- Password hash untuk "admin123" (ganti dengan hash password kamu!)
INSERT INTO "User" (email, password, name, role, status, "createdAt", "updatedAt")
VALUES (
  'admin@nmovie.com',
  '$2a$10$rBV2kBkX5EyW5RzD6sKF1uXhJQNQZNVPZ4YKGxGxOEQGVQMqXqYKC', -- hash untuk "admin123"
  'Admin',
  'ADMIN',
  'APPROVED',
  NOW(),
  NOW()
);

-- Verify
SELECT * FROM "User";

\q
exit
```

**Atau gunakan script untuk hash password:**

```bash
node -e "console.log(require('bcryptjs').hashSync('your_password', 10))"
```

### 5. Start Backend Server

**Manual start:**
```bash
cd /path/to/NMovie/server
npm start
```

**Dengan PM2 (Recommended untuk production):**
```bash
# Install PM2
sudo npm install -g pm2

# Start server
cd /path/to/NMovie/server
pm2 start src/server.js --name nmovie-backend

# Check status
pm2 status

# View logs
pm2 logs nmovie-backend

# Auto-start on system reboot
pm2 startup
pm2 save

# Stop server
pm2 stop nmovie-backend

# Restart server
pm2 restart nmovie-backend
```

---

## 🧪 Test Setup

### 1. Test Database Connection

```bash
cd /path/to/NMovie/server

# Test connection dengan Prisma
npx prisma db pull
# Jika berhasil, schema akan tersync
```

### 2. Test Backend API

```bash
# Health check
curl http://localhost:7001/health

# Atau dari local machine:
curl https://be-mov.nicola.id/health

# Test register
curl -X POST https://be-mov.nicola.id/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'

# Test login
curl -X POST https://be-mov.nicola.id/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@nmovie.com",
    "password": "admin123"
  }'
```

---

## 🔒 Security Best Practices

### 1. PostgreSQL Security

```bash
# Change postgres user password
sudo -i -u postgres
psql
\password postgres
# Masukkan password baru
\q
exit
```

### 2. Generate Strong JWT Secret

```bash
# Generate random string untuk JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Firewall Rules (Production)

```bash
# Hanya allow specific IPs untuk PostgreSQL
sudo ufw delete allow 5432
sudo ufw allow from YOUR_BACKEND_IP to any port 5432

# Atau jika backend di VPS yang sama, block external access:
sudo ufw deny 5432
```

### 4. SSL/TLS untuk Domain

```bash
# Install Certbot untuk Let's Encrypt
sudo apt install certbot -y

# Get SSL certificate
sudo certbot certonly --standalone -d be-mov.nicola.id

# Certificate akan di: /etc/letsencrypt/live/be-mov.nicola.id/
```

---

## 📊 Database Backup & Restore

### Backup Database

```bash
# Backup database
sudo -i -u postgres
pg_dump nuvio_db > /tmp/nuvio_db_backup_$(date +%Y%m%d).sql
exit

# Atau dengan compression
sudo -i -u postgres
pg_dump nuvio_db | gzip > /tmp/nuvio_db_backup_$(date +%Y%m%d).sql.gz
exit

# Auto backup dengan cron (daily at 2 AM)
sudo crontab -e
# Tambahkan line:
0 2 * * * sudo -u postgres pg_dump nuvio_db | gzip > /backup/nuvio_db_$(date +\%Y\%m\%d).sql.gz
```

### Restore Database

```bash
# Restore dari backup
sudo -i -u postgres
psql nuvio_db < /tmp/nuvio_db_backup_20231224.sql
exit

# Atau dari compressed backup
gunzip < /tmp/nuvio_db_backup_20231224.sql.gz | sudo -u postgres psql nuvio_db
```

---

## 🐛 Troubleshooting

### Problem: Cannot connect to database

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check if PostgreSQL listening
sudo netstat -plunt | grep postgres

# Check logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Problem: Prisma migration failed

```bash
# Reset database (⚠️ DANGER: Akan hapus semua data!)
npx prisma migrate reset

# Atau manual drop dan recreate
sudo -i -u postgres
psql
DROP DATABASE nuvio_db;
CREATE DATABASE nuvio_db;
GRANT ALL PRIVILEGES ON DATABASE nuvio_db TO nmovie_admin;
\q
exit

# Run migrations again
npx prisma migrate deploy
```

### Problem: Permission denied for schema public

```bash
sudo -i -u postgres
psql -d nuvio_db

-- Run these commands:
GRANT ALL ON SCHEMA public TO nmovie_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nmovie_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO nmovie_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO nmovie_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO nmovie_admin;

\q
exit
```

### Problem: Password authentication failed

```bash
# Reset password
sudo -i -u postgres
psql
ALTER USER nmovie_admin WITH PASSWORD 'NewPassword123!';
\q
exit

# Update .env dengan password baru
nano /path/to/NMovie/server/.env
```

---

## 📝 Quick Reference Commands

```bash
# PostgreSQL Service
sudo systemctl start postgresql
sudo systemctl stop postgresql
sudo systemctl restart postgresql
sudo systemctl status postgresql

# Access PostgreSQL
sudo -i -u postgres psql
psql -U nmovie_admin -d nuvio_db

# PM2 Commands
pm2 start/stop/restart nmovie-backend
pm2 logs nmovie-backend
pm2 status
pm2 monit

# Prisma Commands
npx prisma migrate deploy
npx prisma generate
npx prisma studio
npx prisma db pull
npx prisma db push
```

---

## ✅ Checklist Setup

- [ ] PostgreSQL installed dan running
- [ ] Database `nuvio_db` created
- [ ] User `nmovie_admin` created dengan password
- [ ] Database privileges granted
- [ ] Firewall configured (port 7001 open)
- [ ] Backend `.env` configured dengan DATABASE_URL yang benar
- [ ] Dependencies installed (`npm install`)
- [ ] Prisma client generated (`npx prisma generate`)
- [ ] Migrations applied (`npx prisma migrate deploy`)
- [ ] Admin user created
- [ ] Backend server running (PM2 atau manual)
- [ ] API tested (health check, login/register)
- [ ] Domain pointing ke VPS (be-mov.nicola.id)
- [ ] SSL certificate installed (optional tapi recommended)

---

## 🎯 Expected Result

Setelah setup selesai, kamu harus bisa:

1. ✅ Access backend: `https://be-mov.nicola.id/health`
2. ✅ Login/Register via API
3. ✅ Database queries via Prisma
4. ✅ Frontend connect ke backend

---

**Need Help?** Check server logs:
```bash
# Backend logs (PM2)
pm2 logs nmovie-backend

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# System logs
journalctl -u postgresql
```

