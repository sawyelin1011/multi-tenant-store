#!/bin/bash
set -e

echo "🔄 Updating dependencies..."

# Backup current package-lock.json
cp package-lock.json package-lock.json.backup

# Update all dependencies
npm upgrade

# Update Playwright
echo "📦 Updating Playwright..."
npm install -D @playwright/test@latest playwright@latest

# Update Vitest
echo "📦 Updating Vitest..."
npm install -D vitest@latest @vitest/ui@latest

# Update Wrangler
echo "📦 Updating Wrangler..."
npm install -D wrangler@latest

# Update TypeScript
echo "📦 Updating TypeScript..."
npm install -D typescript@latest

# Update Cloudflare types
echo "📦 Updating Cloudflare types..."
npm install -D @cloudflare/workers-types@latest

# Check for breaking changes
echo "✓ Running type check..."
npm run type-check

echo "✓ Building application..."
npm run build:all

# Show diff
echo ""
echo "📊 Dependency Changes:"
diff -u package-lock.json.backup package-lock.json | head -50 || true

# Cleanup backup
rm package-lock.json.backup

echo ""
echo "✅ Dependencies updated successfully!"
echo ""
echo "Next steps:"
echo "1. Review the changes: git diff package-lock.json"
echo "2. Run tests: npm run test"
echo "3. Commit: git add . && git commit -m 'chore: update dependencies'"
