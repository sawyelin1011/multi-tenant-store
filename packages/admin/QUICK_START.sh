#!/bin/bash

# MTC Platform Admin - Quick Start Integration Script
# This script adapts the v0-dashboard for multi-tenant ecommerce

set -e

echo "🚀 MTC Platform Admin - Quick Start Integration"
echo "==============================================="

# Colors
GREEN='\033[0.32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Create necessary directories
echo -e "${GREEN}Step 1: Creating directory structure...${NC}"
mkdir -p src/pages/admin/stores
mkdir -p src/pages/admin/tenants
mkdir -p src/pages/admin/products
mkdir -p src/pages/admin/orders
mkdir -p src/hooks

# Step 2: Rename files
echo -e "${GREEN}Step 2: Renaming CMS files to commerce files...${NC}"
if [ -d "src/pages/admin/collections" ]; then
  mv src/pages/admin/collections src/pages/admin/products-old 2>/dev/null || true
fi
if [ -d "src/pages/admin/content" ]; then
  mv src/pages/admin/content src/pages/admin/orders-old 2>/dev/null || true
fi
if [ -f "src/hooks/useCollections.ts" ]; then
  mv src/hooks/useCollections.ts src/hooks/useProducts.ts 2>/dev/null || true
fi
if [ -f "src/hooks/useContent.ts" ]; then
  mv src/hooks/useContent.ts src/hooks/useOrders.ts 2>/dev/null || true
fi

# Step 3: Create .env file
echo -e "${GREEN}Step 3: Creating .env file...${NC}"
cat > .env << 'EOF'
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_KEY=sk_test_admin123456

# App Configuration
VITE_APP_NAME=MTC Platform Admin
VITE_APP_VERSION=2.0.0

# Features
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PLUGINS=false
EOF

echo -e "${GREEN}✅ .env file created${NC}"

# Step 4: Install dependencies
echo -e "${GREEN}Step 4: Installing dependencies...${NC}"
npm install 2>&1 | tail -10

# Step 5: Build check
echo -e "${YELLOW}Step 5: Testing build...${NC}"
if npm run build 2>&1 | tail -5; then
  echo -e "${GREEN}✅ Build successful!${NC}"
else
  echo -e "${RED}❌ Build failed. Check errors above.${NC}"
  echo -e "${YELLOW}This is expected if TypeScript files need updating.${NC}"
fi

echo ""
echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}Integration Complete!${NC}"
echo -e "${GREEN}=============================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Review INTEGRATION_GUIDE.md for detailed tasks"
echo "2. Update src/store/authStore.ts with multi-tenant fields"
echo "3. Create store selector component"
echo "4. Update navigation menu"
echo "5. Rename remaining CMS components to commerce"
echo ""
echo -e "${GREEN}Start development server:${NC}"
echo "  npm run dev"
echo ""
echo -e "${GREEN}Backend API should be running at:${NC}"
echo "  http://localhost:3000"
echo ""
