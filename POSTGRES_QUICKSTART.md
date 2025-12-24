# PostgreSQL Quick Start - NMovie

Quick reference untuk setup PostgreSQL di VPS.

---

## 🚀 Method 1: Automated Script (Recommended)

```bash
# 1. Upload project ke VPS
cd /path/to/NMovie

# 2. Run setup script
./setup-postgres.sh

# Script akan:
# - Install PostgreSQL
# - Create database dan user
# - Setup permissions
# - Generate DATABASE_URL
# - Update .env (optional)
```

---

## ⚡ Method 2: Manual (5 Menit)

### Step 1: Install PostgreSQL
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
```

### Step 2: Create Database & User
```bash
sudo -i -u postgres psql
```

Di PostgreSQL console:
```sql
CREATE DATABASE nuvio_db;
CREATE USER nmovie_admin WITH ENCRYPTED PASSWORD '@Nandha20';
GRANT ALL PRIVILEGES ON DATABASE nuvio_db TO nmovie_admin;
\c nuvio_db
GRANT ALL ON SCHEMA public TO nmovie_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nmovie_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO nmovie_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO nmovie_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO nmovie_admin;
\q
exit
```

### Step 3: Update Backend Config
```bash
cd /path/to/NMovie/server
nano .env
```

Add:
```env
DATABASE_URL="postgresql://nmovie_admin:your_strong_password@localhost:5432/nuvio_db?schema=public"
PORT=7001
JWT_SECRET="your-secret-key"
```

### Step 4: Run Migrations
```bash
npm install
npx prisma generate
npx prisma migrate deploy
```

### Step 5: Start Server
```bash
# With PM2 (recommended)
npm install -g pm2
pm2 start src/server.js --name nmovie-backend

# Or manual
npm start
```

---

## 🧪 Test Connection

```bash
# Test database
psql -U nmovie_admin -d nuvio_db -h localhost

# Test backend
curl http://localhost:7001/health
curl https://be-mov.nicola.id/health

# Test API
curl -X POST https://be-mov.nicola.id/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@mail.com","password":"pass123"}'
```

---

## 📝 Essential Commands

### PostgreSQL
```bash
# Service
sudo systemctl start/stop/restart postgresql
sudo systemctl status postgresql

# Access
sudo -i -u postgres psql
psql -U nmovie_admin -d nuvio_db

# Common SQL
\l                  # List databases
\du                 # List users
\c nuvio_db         # Connect to database
\dt                 # List tables
\q                  # Quit
```

### Prisma
```bash
npx prisma generate         # Generate client
npx prisma migrate deploy   # Run migrations
npx prisma studio          # Open GUI
npx prisma db pull         # Sync schema
```

### PM2
```bash
pm2 start src/server.js --name nmovie-backend
pm2 stop/restart nmovie-backend
pm2 logs nmovie-backend
pm2 status
pm2 monit
pm2 startup    # Auto-start on reboot
pm2 save       # Save current list
```

---

## 🔒 Security Checklist

```bash
# ✅ Change default passwords
# ✅ Use strong JWT_SECRET
# ✅ Configure firewall
sudo ufw allow 22      # SSH
sudo ufw allow 7001    # Backend
sudo ufw enable

# ✅ Block external PostgreSQL access (if backend on same VPS)
sudo ufw deny 5432

# ✅ Setup SSL for domain
sudo apt install certbot
sudo certbot certonly --standalone -d be-mov.nicola.id
```

---

## 🐛 Common Issues

### Cannot connect to database
```bash
# Check status
sudo systemctl status postgresql

# Check listening
sudo netstat -plunt | grep postgres

# View logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Permission denied
```bash
sudo -i -u postgres psql -d nuvio_db
GRANT ALL ON SCHEMA public TO nmovie_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nmovie_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO nmovie_admin;
\q
exit
```

### Migration failed
```bash
# Drop and recreate (⚠️ loses data!)
sudo -i -u postgres psql
DROP DATABASE nuvio_db;
CREATE DATABASE nuvio_db;
GRANT ALL PRIVILEGES ON DATABASE nuvio_db TO nmovie_admin;
\q
exit

# Run migrations
npx prisma migrate deploy
```

---

## 📦 Database Backup

```bash
# Backup
sudo -u postgres pg_dump nuvio_db > backup_$(date +%Y%m%d).sql

# Restore
sudo -u postgres psql nuvio_db < backup_20231224.sql

# Auto backup (cron, daily 2 AM)
sudo crontab -e
# Add: 0 2 * * * sudo -u postgres pg_dump nuvio_db | gzip > /backup/nuvio_$(date +\%Y\%m\%d).sql.gz
```

---

## 📚 Full Documentation

For detailed guide, see: **[POSTGRESQL_VPS_SETUP.md](./POSTGRESQL_VPS_SETUP.md)**

---

## 💡 Quick Tips

1. **Always backup before migrations**
2. **Use PM2 for production** (auto-restart, logs, monitoring)
3. **Set up SSL/TLS** for production domain
4. **Monitor logs** with `pm2 logs` and `journalctl`
5. **Keep PostgreSQL updated**: `sudo apt update && sudo apt upgrade`

---

## 🎯 Expected Result

After setup:
- ✅ PostgreSQL running on port 5432
- ✅ Backend running on port 7001
- ✅ Domain `be-mov.nicola.id` accessible
- ✅ API endpoints working
- ✅ Frontend can connect to backend
- ✅ User registration/login working

Test URL: `https://be-mov.nicola.id/api/auth/login`

