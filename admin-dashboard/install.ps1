# IntelliSight Dashboard - Complete Installation & Testing Script
# Run this script to install and test the admin dashboard

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  IntelliSight Admin Dashboard Setup" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check prerequisites
Write-Host "[1/6] Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "  ✓ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Node.js not found. Please install Node.js 16+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Host "  ✓ npm installed: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ npm not found" -ForegroundColor Red
    exit 1
}

# Navigate to dashboard directory
Write-Host "`n[2/6] Navigating to dashboard directory..." -ForegroundColor Yellow
Set-Location "admin-dashboard"

# Install dependencies
Write-Host "`n[3/6] Installing dependencies..." -ForegroundColor Yellow
Write-Host "  This may take a few minutes..." -ForegroundColor Gray

npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "  ✓ Dependencies installed successfully" -ForegroundColor Green

# Create .env file
Write-Host "`n[4/6] Creating environment file..." -ForegroundColor Yellow

if (Test-Path ".env") {
    Write-Host "  ⚠ .env file already exists, skipping..." -ForegroundColor Yellow
} else {
    Copy-Item ".env.example" ".env"
    Write-Host "  ✓ Created .env file from template" -ForegroundColor Green
}

# Check backend availability
Write-Host "`n[5/6] Checking backend connection..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -Method Get -ErrorAction Stop
    Write-Host "  ✓ Backend is running at http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ Backend not reachable at http://localhost:3000" -ForegroundColor Yellow
    Write-Host "  ℹ Make sure to start the backend with: npm run dev" -ForegroundColor Gray
}

# Display setup summary
Write-Host "`n[6/6] Setup Complete!" -ForegroundColor Green
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Installation Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nInstalled packages:" -ForegroundColor White
Write-Host "  - React 18.2.0" -ForegroundColor Gray
Write-Host "  - Vite 5.0.7" -ForegroundColor Gray
Write-Host "  - React Router 6.20.0" -ForegroundColor Gray
Write-Host "  - Axios 1.6.2" -ForegroundColor Gray
Write-Host "  - TailwindCSS 3.3.6" -ForegroundColor Gray
Write-Host "  - React Icons 4.12.0" -ForegroundColor Gray
Write-Host "  - date-fns 3.0.0" -ForegroundColor Gray

Write-Host "`nEnvironment Configuration:" -ForegroundColor White
Write-Host "  - API URL: http://localhost:3000/api" -ForegroundColor Gray
Write-Host "  - Polling Interval: 5000ms (5 seconds)" -ForegroundColor Gray

Write-Host "`nLogin Credentials:" -ForegroundColor White
Write-Host "  - Email: john.admin@intellisight.com" -ForegroundColor Gray
Write-Host "  - Password: admin123" -ForegroundColor Gray

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Next Steps" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n1. Start the backend (if not already running):" -ForegroundColor White
Write-Host "   cd .." -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray

Write-Host "`n2. Start the dashboard:" -ForegroundColor White
Write-Host "   cd admin-dashboard" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray

Write-Host "`n3. Open your browser:" -ForegroundColor White
Write-Host "   http://localhost:3001" -ForegroundColor Gray

Write-Host "`n4. Login with admin credentials" -ForegroundColor White

Write-Host "`n========================================" -ForegroundColor Cyan

Write-Host "`nWould you like to start the development server now? [Y/N]" -ForegroundColor Yellow
$start = Read-Host

if ($start -eq "Y" -or $start -eq "y") {
    Write-Host "`nStarting development server..." -ForegroundColor Green
    Write-Host "Dashboard will open at http://localhost:3001`n" -ForegroundColor Cyan
    npm run dev
} else {
    Write-Host "`nTo start the dashboard later, run:" -ForegroundColor White
    Write-Host "  cd admin-dashboard" -ForegroundColor Gray
    Write-Host "  npm run dev`n" -ForegroundColor Gray
}
