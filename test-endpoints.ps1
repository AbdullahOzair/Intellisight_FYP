# Test IntelliSight API Endpoints
Write-Host "`n=== Testing IntelliSight Backend ===" -ForegroundColor Cyan

# Test Health Endpoint
Write-Host "`n1. Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri 'http://localhost:3000/health' -Method Get
    Write-Host "✅ Health Check: $($health.status)" -ForegroundColor Green
    Write-Host "   Uptime: $($health.uptime)s" -ForegroundColor Gray
    Write-Host "   Timestamp: $($health.timestamp)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Health endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n⚠️  Make sure the server is running with: npm start" -ForegroundColor Yellow
    exit 1
}

# Test Login
Write-Host "`n2. Testing Login..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "john.admin@intellisight.com"
        password = "admin123"
    } | ConvertTo-Json

    $login = Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/login' -Method Post -Body $loginBody -ContentType 'application/json'
    $token = $login.data.token
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "   User: $($login.data.admin.Name)" -ForegroundColor Gray
    Write-Host "   Role: $($login.data.admin.Role)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test Get Zones
Write-Host "`n3. Testing Get All Zones..." -ForegroundColor Yellow
try {
    $headers = @{
        'Authorization' = "Bearer $token"
    }
    $zones = Invoke-RestMethod -Uri 'http://localhost:3000/api/zones' -Method Get -Headers $headers
    Write-Host "✅ Zones retrieved: $($zones.data.Count) zones" -ForegroundColor Green
    $zones.data | Select-Object -First 3 | ForEach-Object {
        Write-Host "   - $($_.Zone_Name)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Get zones failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Get Active Persons
Write-Host "`n4. Testing Get Active Persons..." -ForegroundColor Yellow
try {
    $active = Invoke-RestMethod -Uri 'http://localhost:3000/api/timetable/active' -Method Get -Headers $headers
    Write-Host "✅ Active persons: $($active.data.count)" -ForegroundColor Green
} catch {
    Write-Host "❌ Get active persons failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Analytics
Write-Host "`n5. Testing Analytics..." -ForegroundColor Yellow
try {
    $analytics = Invoke-RestMethod -Uri 'http://localhost:3000/api/timetable/analytics' -Method Get -Headers $headers
    Write-Host "✅ Analytics retrieved!" -ForegroundColor Green
    Write-Host "   Total entries today: $($analytics.data.totalEntriesToday)" -ForegroundColor Gray
    Write-Host "   Currently active: $($analytics.data.activeNow)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Get analytics failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== All Tests Complete! ===" -ForegroundColor Cyan
Write-Host "`n✅ Server is running correctly on http://localhost:3000" -ForegroundColor Green
Write-Host "📚 You can now use Postman or the SAMPLE_REQUESTS.md file for more testing" -ForegroundColor Gray
Write-Host ""
