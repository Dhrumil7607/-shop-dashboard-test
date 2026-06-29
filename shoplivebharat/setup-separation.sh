#!/bin/bash
# Setup script to copy shared components from frontend to waiting-page

set -e

echo "🚀 ShopLive Bharat - Website Separation Setup"
echo "============================================="
echo ""

# Check if we're in the right directory
if [ ! -d "frontend" ] || [ ! -d "waiting-page" ]; then
    echo "❌ Error: This script must be run from the shoplivebharat directory"
    echo "📁 Expected structure: shoplivebharat/"
    echo "   ├── frontend/"
    echo "   ├── waiting-page/"
    echo "   └── setup-separation.sh"
    exit 1
fi

echo "📂 Copying shared components..."

# Create directories if they don't exist
mkdir -p waiting-page/src/components
mkdir -p waiting-page/src/lib
mkdir -p waiting-page/src/hooks
mkdir -p waiting-page/src/contexts

# Copy components
if [ -d "frontend/src/components" ]; then
    cp -r frontend/src/components/* waiting-page/src/components/ 2>/dev/null || true
    echo "✅ Components copied"
else
    echo "⚠️  frontend/src/components not found"
fi

# Copy lib utilities
if [ -d "frontend/src/lib" ]; then
    cp -r frontend/src/lib/* waiting-page/src/lib/ 2>/dev/null || true
    echo "✅ Library utilities copied"
else
    echo "⚠️  frontend/src/lib not found"
fi

# Copy hooks
if [ -d "frontend/src/hooks" ]; then
    cp -r frontend/src/hooks/* waiting-page/src/hooks/ 2>/dev/null || true
    echo "✅ Hooks copied"
else
    echo "⚠️  frontend/src/hooks not found"
fi

# Copy contexts
if [ -d "frontend/src/contexts" ]; then
    cp -r frontend/src/contexts/* waiting-page/src/contexts/ 2>/dev/null || true
    echo "✅ Contexts copied"
else
    echo "⚠️  frontend/src/contexts not found"
fi

echo ""
echo "📦 Installing dependencies..."
echo ""

# Install frontend dependencies
echo "Installing marketplace dependencies..."
cd frontend
if command -v yarn &> /dev/null; then
    yarn install --frozen-lockfile
else
    npm install
fi
cd ..

echo ""

# Install waiting-page dependencies
echo "Installing waiting page dependencies..."
cd waiting-page
if command -v yarn &> /dev/null; then
    yarn install --frozen-lockfile
else
    npm install
fi
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo ""
echo "1. Create .env files:"
echo "   cp frontend/.env.example frontend/.env"
echo "   cp waiting-page/.env.example waiting-page/.env"
echo ""
echo "2. Start development servers:"
echo "   Terminal 1: cd frontend && yarn start"
echo "   Terminal 2: cd waiting-page && yarn start"
echo ""
echo "3. For production deployment, see SEPARATION_GUIDE.md"
echo ""
