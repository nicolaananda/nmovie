#!/bin/bash

# Nuvio Web - Quick Start Script
# This script helps you get started quickly

echo "🎬 Nuvio Web - Quick Start Setup"
echo "================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Warning: Node.js version is too old (need v18+)"
    echo "Current version: $(node -v)"
    echo "Please upgrade Node.js"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo ""

# Check if we're in the web directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found!"
    echo "Please run this script from the web directory:"
    echo "  cd web"
    echo "  ./quick-start.sh"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
echo ""
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "✅ Dependencies installed successfully!"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cat > .env << EOF
# TMDB API Configuration
VITE_TMDB_API_KEY=your_tmdb_api_key_here

# App Configuration
VITE_APP_NAME=Nuvio
VITE_APP_VERSION=1.0.0
EOF
    echo "✅ .env file created!"
    echo ""
    echo "⚠️  IMPORTANT: You need to add your TMDB API key to the .env file"
    echo ""
    echo "To get a TMDB API key:"
    echo "1. Go to https://www.themoviedb.org/"
    echo "2. Create an account (free)"
    echo "3. Go to Settings → API"
    echo "4. Request an API Key (choose 'Developer')"
    echo "5. Copy your API Key (v3 auth)"
    echo "6. Edit .env file and replace 'your_tmdb_api_key_here' with your actual key"
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
fi

# Summary
echo "================================"
echo "🎉 Setup Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Add your TMDB API key to the .env file (if you haven't already)"
echo "   Edit: .env"
echo ""
echo "2. Start the development server:"
echo "   npm run dev"
echo ""
echo "3. Open your browser and visit:"
echo "   http://localhost:3000"
echo ""
echo "📚 Documentation:"
echo "   - SETUP.md - Detailed setup guide"
echo "   - README.md - General information"
echo "   - MIGRATION_GUIDE.md - Technical details"
echo "   - RINGKASAN_INDONESIA.md - Indonesian summary"
echo ""
echo "Happy coding! 🚀"
echo ""

