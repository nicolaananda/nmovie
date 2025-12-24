#!/bin/bash

# NMovie Production Deployment Script
# Run this after making changes

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🚀 NMovie Production Deployment                           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Build Frontend
echo -e "${YELLOW}📦 Step 1: Building Frontend...${NC}"
npm run build
echo -e "${GREEN}✅ Build complete${NC}"
echo ""

# Step 2: Show build info
echo -e "${YELLOW}📊 Build Information:${NC}"
echo "API URL configured: $(grep VITE_API_URL .env | cut -d '=' -f2)"
echo "Build output: dist/"
ls -lh dist/assets/*.js | tail -3
echo ""

# Step 3: Instructions
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo ""
echo "Frontend Deployment:"
echo "  scp -r dist/* user@vps:/path/to/public_html/"
echo ""
echo "Backend Deployment:"
echo "  ssh user@vps"
echo "  cd /root/Me/nmovie"
echo "  git pull origin master"
echo "  pm2 restart nmovie-backend"
echo ""

# Optional: Auto-deploy if SSH config exists
read -p "Deploy to VPS automatically? (y/n): " DEPLOY

if [ "$DEPLOY" = "y" ] || [ "$DEPLOY" = "Y" ]; then
    echo ""
    echo -e "${YELLOW}📤 Deploying to VPS...${NC}"
    
    read -p "Enter VPS SSH host (e.g., root@your-vps-ip): " SSH_HOST
    read -p "Enter frontend path (e.g., /var/www/html): " FRONTEND_PATH
    
    echo "Uploading frontend files..."
    scp -r dist/* "$SSH_HOST:$FRONTEND_PATH/"
    
    echo "Updating backend..."
    ssh "$SSH_HOST" << 'ENDSSH'
cd /root/Me/nmovie
git pull origin master
pm2 restart nmovie-backend
pm2 logs nmovie-backend --lines 10
ENDSSH
    
    echo ""
    echo -e "${GREEN}✅ Deployment complete!${NC}"
    echo ""
    echo "Test your site:"
    echo "  https://ghzm.us"
    echo ""
else
    echo ""
    echo -e "${YELLOW}Manual deployment required.${NC}"
    echo "Use the commands above to deploy."
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  ✅ Script Complete                                        ║"
echo "╚════════════════════════════════════════════════════════════╝"

