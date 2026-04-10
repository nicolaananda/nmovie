#!/bin/bash

# Nuvio v2.0 - Production Start Script
# For VPS deployment at ghzm.us

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Nuvio v2.0 - Production Startup${NC}"
echo "================================"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}❌ Don't run this script as root!${NC}"
    echo "Run as your regular user instead."
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️  PM2 not found. Installing...${NC}"
    npm install -g pm2
    echo -e "${GREEN}✓ PM2 installed${NC}"
fi

# Check environment files
if [ ! -f "server/.env" ]; then
    echo -e "${RED}❌ server/.env not found!${NC}"
    echo "Please create server/.env with production settings"
    exit 1
fi

if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env not found!${NC}"
    echo "Please create .env with production settings"
    exit 1
fi

# Verify critical environment variables
echo "🔍 Checking environment variables..."
cd server
if ! grep -q "JWT_SECRET=" .env || grep -q "JWT_SECRET=your_jwt_secret_here" .env; then
    echo -e "${RED}❌ JWT_SECRET not set in server/.env!${NC}"
    echo "Generate one with: openssl rand -base64 32"
    exit 1
fi

if ! grep -q "DATABASE_URL=" .env; then
    echo -e "${RED}❌ DATABASE_URL not set in server/.env!${NC}"
    exit 1
fi
cd ..

echo -e "${GREEN}✓ Environment variables OK${NC}"
echo ""

# Install/Update dependencies
echo "📦 Installing dependencies..."
if [ ! -d "node_modules" ] || [ "$1" == "--fresh" ]; then
    echo "Installing frontend dependencies..."
    npm install --production
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
fi

if [ ! -d "server/node_modules" ] || [ "$1" == "--fresh" ]; then
    echo "Installing backend dependencies..."
    cd server && npm install --production && cd ..
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
fi
echo ""

# Build frontend
echo "🏗️  Building frontend for production..."
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend built successfully${NC}"
else
    echo -e "${RED}❌ Frontend build failed!${NC}"
    exit 1
fi
echo ""

# Setup database
echo "🗄️  Setting up database..."
cd server

# Generate Prisma Client
npx prisma generate > /dev/null 2>&1
echo -e "${GREEN}✓ Prisma Client generated${NC}"

# Run migrations
if npx prisma migrate deploy; then
    echo -e "${GREEN}✓ Database migrations applied${NC}"
else
    echo -e "${RED}❌ Database migration failed!${NC}"
    exit 1
fi

cd ..
echo ""

# Create logs directory
mkdir -p server/logs
echo -e "${GREEN}✓ Logs directory ready${NC}"
echo ""

# Stop existing PM2 processes
echo "🔄 Stopping existing processes..."
pm2 delete nuvio-server 2>/dev/null || true
echo ""

# Start backend with PM2
echo "🚀 Starting backend server..."
cd server
pm2 start src/server.js --name nuvio-server \
    --node-args="--max-old-space-size=2048" \
    --time \
    --log-date-format="YYYY-MM-DD HH:mm:ss Z" \
    --merge-logs \
    --output logs/pm2-out.log \
    --error logs/pm2-error.log

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend server started${NC}"
else
    echo -e "${RED}❌ Failed to start backend server!${NC}"
    exit 1
fi
cd ..
echo ""

# Save PM2 configuration
pm2 save
echo -e "${GREEN}✓ PM2 configuration saved${NC}"
echo ""

# Setup PM2 startup script (optional)
if [ "$1" == "--setup-startup" ]; then
    echo "⚙️  Setting up PM2 startup script..."
    pm2 startup
    echo ""
    echo -e "${YELLOW}⚠️  Run the command above to enable PM2 on system boot${NC}"
    echo ""
fi

# Display status
echo "================================"
echo -e "${GREEN}✅ Production Deployment Complete!${NC}"
echo "================================"
echo ""
echo "📊 Server Status:"
pm2 status
echo ""
echo "🌐 URLs:"
echo "  Frontend: https://ghzm.us"
echo "  Backend:  http://localhost:7001"
echo ""
echo "📝 Useful Commands:"
echo "  pm2 status           - Check server status"
echo "  pm2 logs nuvio-server - View server logs"
echo "  pm2 restart nuvio-server - Restart server"
echo "  pm2 stop nuvio-server - Stop server"
echo "  pm2 monit            - Monitor resources"
echo ""
echo "📁 Log Files:"
echo "  Backend: server/logs/combined.log"
echo "  PM2:     server/logs/pm2-out.log"
echo "  Errors:  server/logs/pm2-error.log"
echo ""
echo "🔧 Nginx Configuration:"
echo "  Make sure Nginx is configured to:"
echo "  - Serve /home/$(whoami)/se/nmovie/dist for frontend"
echo "  - Proxy /api to http://localhost:7001"
echo ""
echo "  Example: sudo nano /etc/nginx/sites-available/ghzm.us"
echo ""
echo "🎉 Your app is now running in production!"
