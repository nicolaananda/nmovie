#!/bin/bash

# Nuvio v2.0 - Quick Start Script
# This script helps you get started quickly

set -e

echo "🚀 Nuvio v2.0 - Quick Start"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f "server/.env" ]; then
    echo -e "${YELLOW}⚠️  server/.env not found!${NC}"
    echo "Creating from .env.example..."
    cp server/.env.example server/.env
    echo -e "${GREEN}✓ Created server/.env${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Edit server/.env and set:${NC}"
    echo "   - DATABASE_URL (your PostgreSQL connection)"
    echo "   - JWT_SECRET (run: openssl rand -base64 32)"
    echo "   - CORS_ORIGINS (your domain)"
    echo ""
    read -p "Press Enter after updating server/.env..."
fi

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env not found!${NC}"
    echo "Creating from .env.example..."
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Edit .env and set:${NC}"
    echo "   - VITE_TMDB_API_KEY (get from themoviedb.org)"
    echo ""
    read -p "Press Enter after updating .env..."
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
    echo ""
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd server && npm install && cd ..
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
    echo ""
fi

# Check if Prisma is set up
echo "🗄️  Setting up database..."
cd server

# Generate Prisma Client
npx prisma generate > /dev/null 2>&1
echo -e "${GREEN}✓ Prisma Client generated${NC}"

# Check if database is accessible
if npx prisma db push --skip-generate > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database connected and schema synced${NC}"
else
    echo -e "${RED}❌ Database connection failed!${NC}"
    echo "Please check your DATABASE_URL in server/.env"
    exit 1
fi

cd ..

echo ""
echo "================================"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "================================"
echo ""
echo "📝 Quick Commands:"
echo ""
echo "  Start Frontend:  npm run dev"
echo "  Start Backend:   npm run server:dev"
echo ""
echo "  Or start both:"
echo "  npm run dev & npm run server:dev"
echo ""
echo "🌐 URLs:"
echo "  Frontend: http://localhost:3000 (or 3001 if 3000 is busy)"
echo "  Backend:  http://localhost:7001"
echo ""
echo "📚 Documentation:"
echo "  - SETUP_GUIDE.md - Complete setup guide"
echo "  - FEATURES_V2.md - All features"
echo "  - SECURITY_NOTES.md - Security considerations"
echo "  - MIGRATION_V2.md - Migration from v1"
echo ""
echo "🎉 Happy coding!"
