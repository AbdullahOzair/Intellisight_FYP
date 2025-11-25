# IntelliSight Backend - Quick Start Guide

## Starting the Server

### Option 1: Using npm (Recommended for testing)
Open a PowerShell terminal and run:
```powershell
cd D:\FYPprojectIntelisight
npm start
```

The server will start on **http://localhost:3000**

You should see:
```
✅ Database connected successfully
🚀 Server running on port 3000
📡 Environment: development
🔗 Health check: http://localhost:3000/health
📚 API base URL: http://localhost:3000/api
```

### Option 2: Using nodemon (for development)
```powershell
npm run dev
```

## Testing the Endpoints

### Method 1: Run the Test Script
Open a **NEW** PowerShell window (keep the server running in the first one):
```powershell
cd D:\FYPprojectIntelisight
.\test-endpoints.ps1
```

This will test:
- ✅ Health endpoint
- ✅ Login
- ✅ Get zones
- ✅ Get active persons
- ✅ Analytics

### Method 2: Manual Testing with PowerShell

**1. Test Health Endpoint:**
```powershell
Invoke-RestMethod -Uri 'http://localhost:3000/health' | ConvertTo-Json
```

**2. Login:**
```powershell
$loginBody = @{
    email = "john.admin@intellisight.com"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/login' -Method Post -Body $loginBody -ContentType 'application/json'
$token = $response.data.token
Write-Host "Token: $token"
```

**3. Get Zones (requires authentication):**
```powershell
$headers = @{ 'Authorization' = "Bearer $token" }
Invoke-RestMethod -Uri 'http://localhost:3000/api/zones' -Headers $headers | ConvertTo-Json -Depth 5
```

**4. Get Active Persons:**
```powershell
Invoke-RestMethod -Uri 'http://localhost:3000/api/timetable/active' -Headers $headers | ConvertTo-Json -Depth 5
```

### Method 3: Using Postman
1. Import the Postman collection: `postman_collection.json`
2. The collection includes all endpoints pre-configured
3. Use the login endpoint first to get a token
4. The token will auto-populate in other requests

### Method 4: Using Your Browser
Open these URLs in your browser:
- **Health Check**: http://localhost:3000/health
- **API Docs**: See SAMPLE_REQUESTS.md for all available endpoints

## Troubleshooting

### "Connection refused" or "Cannot connect"
- Make sure the server is running (`npm start` in a separate terminal)
- Check if port 3000 is already in use: `netstat -ano | findstr :3000`
- Verify database is running on port 5000

### "Database connection failed"
- Ensure PostgreSQL is running on port 5000
- Check credentials in `.env` file
- Run `npx prisma db push` to sync the schema

### Tests Failing
- Re-seed the database: `npm run seed`
- Regenerate Prisma client: `npx prisma generate`

## Available Commands

```powershell
npm start              # Start production server
npm run dev            # Start development server (auto-reload)
npm test               # Run all tests
npm run seed           # Seed database with sample data
npm run studio         # Open Prisma Studio (database GUI)
npx prisma generate    # Regenerate Prisma client
npx prisma db push     # Sync schema to database
```

## Test Credentials

**Admin Account:**
- Email: `john.admin@intellisight.com`
- Password: `admin123`
- Role: Super Admin

## Next Steps

1. Start the server in one terminal: `npm start`
2. Run the test script in another terminal: `.\test-endpoints.ps1`
3. Review `SAMPLE_REQUESTS.md` for all API endpoints
4. Import `postman_collection.json` into Postman for easier testing
5. Use `npm run studio` to visually browse the database

Happy testing! 🚀
