#!/bin/bash
# Pre-deployment check script
# Ensures build will succeed in CI/CD

set -e

echo "🧹 Cleaning..."
rm -rf node_modules .turbo

echo "📦 Installing dependencies..."
pnpm install

echo "✅ Approving build scripts..."
echo "Please approve: prisma, @prisma/client, bcrypt, esbuild"
pnpm approve-builds

echo "🔨 Building all packages..."
pnpm -r build

echo "✅ Pre-deployment check passed!"
echo "Ready to deploy 🚀"

