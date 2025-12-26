# Pre-deployment check script for Windows/PowerShell
# Ensures build will succeed in CI/CD

Write-Host "🧹 Cleaning..." -ForegroundColor Cyan
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue node_modules, .turbo

Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
pnpm install

Write-Host "✅ Approving build scripts..." -ForegroundColor Yellow
Write-Host "Please approve: prisma, @prisma/client, bcrypt, esbuild" -ForegroundColor Yellow
pnpm approve-builds

Write-Host "🔨 Building all packages..." -ForegroundColor Cyan
pnpm -r build

Write-Host "✅ Pre-deployment check passed!" -ForegroundColor Green
Write-Host "Ready to deploy 🚀" -ForegroundColor Green

