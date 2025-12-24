#!/bin/bash

# NMovie PostgreSQL Setup Script
# Untuk Ubuntu/Debian VPS

set -e

echo "🚀 NMovie PostgreSQL Setup"
echo "=========================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}⚠️  Jangan run script ini sebagai root!${NC}"
   echo "Run dengan: ./setup-postgres.sh"
   exit 1
fi

echo -e "${YELLOW}📦 Step 1: Update system...${NC}"
sudo apt update && sudo apt upgrade -y

echo ""
echo -e "${YELLOW}📦 Step 2: Install PostgreSQL...${NC}"
sudo apt install postgresql postgresql-contrib -y

echo ""
echo -e "${YELLOW}🔧 Step 3: Start PostgreSQL service...${NC}"
sudo systemctl start postgresql
sudo systemctl enable postgresql

echo ""
echo -e "${GREEN}✅ PostgreSQL installed successfully!${NC}"
echo ""

# Get database credentials
echo -e "${YELLOW}📝 Database Configuration${NC}"
echo ""
read -p "Enter database name (default: nuvio_db): " DB_NAME
DB_NAME=${DB_NAME:-nuvio_db}

read -p "Enter database user (default: nmovie_admin): " DB_USER
DB_USER=${DB_USER:-nmovie_admin}

read -sp "Enter database password: " DB_PASSWORD
echo ""

if [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}❌ Password cannot be empty!${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🗄️  Creating database and user...${NC}"

# Create SQL commands
SQL_COMMANDS="
-- Create database
CREATE DATABASE $DB_NAME;

-- Create user
CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Connect to database
\\c $DB_NAME

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
"

# Execute SQL commands
echo "$SQL_COMMANDS" | sudo -u postgres psql

echo ""
echo -e "${GREEN}✅ Database setup completed!${NC}"
echo ""

# Generate DATABASE_URL
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public"

echo -e "${YELLOW}📝 Your DATABASE_URL:${NC}"
echo ""
echo -e "${GREEN}$DATABASE_URL${NC}"
echo ""

# Ask if want to update .env
read -p "Update server/.env file? (y/n): " UPDATE_ENV

if [ "$UPDATE_ENV" = "y" ] || [ "$UPDATE_ENV" = "Y" ]; then
    if [ -f "server/.env" ]; then
        # Backup existing .env
        cp server/.env server/.env.backup
        echo -e "${YELLOW}📦 Backed up existing .env to .env.backup${NC}"
        
        # Update DATABASE_URL in .env
        if grep -q "^DATABASE_URL=" server/.env; then
            sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|" server/.env
        else
            echo "DATABASE_URL=\"$DATABASE_URL\"" >> server/.env
        fi
        
        echo -e "${GREEN}✅ Updated server/.env${NC}"
    else
        echo -e "${RED}⚠️  server/.env not found${NC}"
        echo "Please create it manually with DATABASE_URL"
    fi
fi

echo ""
echo -e "${YELLOW}🔧 Next Steps:${NC}"
echo "1. cd server"
echo "2. npm install"
echo "3. npx prisma generate"
echo "4. npx prisma migrate deploy"
echo "5. npm start"
echo ""

echo -e "${YELLOW}🔒 Security Notes:${NC}"
echo "- Change JWT_SECRET in server/.env"
echo "- Configure firewall (ufw allow 7001)"
echo "- Use strong passwords"
echo "- Enable SSL/TLS for production"
echo ""

echo -e "${GREEN}✅ PostgreSQL setup complete!${NC}"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo ""
echo -e "${YELLOW}Test connection:${NC}"
echo "psql -U $DB_USER -d $DB_NAME -h localhost"
echo ""

