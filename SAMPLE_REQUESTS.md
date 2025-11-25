# IntelliSight API - Sample Requests

## 🚀 Quick Start - PowerShell Commands

**1. Start the server (in terminal 1):**
```powershell
npm start
```

**2. Test endpoints (in terminal 2):**
```powershell
# Health Check
Invoke-RestMethod http://localhost:3000/health

# Login and save token
$body = @{ email = "john.admin@intellisight.com"; password = "admin123" } | ConvertTo-Json
$login = Invoke-RestMethod -Uri http://localhost:3000/api/auth/login -Method Post -Body $body -ContentType 'application/json'
$token = $login.data.token

# Get zones (authenticated)
$headers = @{ 'Authorization' = "Bearer $token" }
Invoke-RestMethod -Uri http://localhost:3000/api/zones -Headers $headers

# Get active persons
Invoke-RestMethod -Uri http://localhost:3000/api/timetable/active -Headers $headers
```

---

## Authentication

### Register Admin
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Administrator",
    "email": "john.admin@intellisight.com",
    "password": "SecurePass123!",
    "role": "Super Admin"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "admin": {
      "Admin_ID": 1,
      "Name": "John Administrator",
      "Email": "john.admin@intellisight.com",
      "Role": "Super Admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Registration successful"
}
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.admin@intellisight.com",
    "password": "admin123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "admin": {
      "Admin_ID": 1,
      "Name": "John Administrator",
      "Email": "john.admin@intellisight.com",
      "Role": "Super Admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

---

## Zones

### Get All Zones
```bash
curl -X GET http://localhost:3000/api/zones \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Zone by ID
```bash
curl -X GET http://localhost:3000/api/zones/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Zone
```bash
curl -X POST http://localhost:3000/api/zones \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "Zone_Name": "Computer Lab - Floor 2"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "Zone_id": 6,
    "Zone_Name": "Computer Lab - Floor 2"
  },
  "message": "Resource created successfully"
}
```

### Update Zone
```bash
curl -X PUT http://localhost:3000/api/zones/6 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "Zone_Name": "Computer Lab - Updated"
  }'
```

### Delete Zone
```bash
curl -X DELETE http://localhost:3000/api/zones/6 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Cameras

### Get All Cameras
```bash
curl -X GET http://localhost:3000/api/cameras \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Camera
```bash
curl -X POST http://localhost:3000/api/cameras \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "Password": "cam_secure_007",
    "Zone_id": 1
  }'
```

### Update Camera
```bash
curl -X PUT http://localhost:3000/api/cameras/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "Password": "new_password_123",
    "Zone_id": 2
  }'
```

---

## Teachers

### Get All Teachers
```bash
curl -X GET http://localhost:3000/api/teachers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Teacher by ID
```bash
curl -X GET http://localhost:3000/api/teachers/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Teacher
```bash
curl -X POST http://localhost:3000/api/teachers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "Name": "Dr. Sarah Johnson",
    "Email": "sarah.j@intellisight.edu",
    "Camara_Id": 1,
    "Zone_id": 1
  }'
```

### Create Teacher with Face Picture (Base64)
```bash
curl -X POST http://localhost:3000/api/teachers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "Name": "Dr. Sarah Johnson",
    "Email": "sarah.j@intellisight.edu",
    "Camara_Id": 1,
    "Zone_id": 1,
    "Face_Pictures": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }'
```

### Upload Face Picture for Existing Teacher
```bash
curl -X POST http://localhost:3000/api/teachers/1/face-picture \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "Face_Pictures": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }'
```

### Update Teacher
```bash
curl -X PUT http://localhost:3000/api/teachers/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "Name": "Dr. Sarah Johnson (Updated)",
    "Zone_id": 2
  }'
```

### Delete Teacher
```bash
curl -X DELETE http://localhost:3000/api/teachers/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Students

### Get All Students
```bash
curl -X GET http://localhost:3000/api/students \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Student by ID
```bash
curl -X GET http://localhost:3000/api/students/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Student
```bash
curl -X POST http://localhost:3000/api/students \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "Name": "Alice Williams",
    "Email": "alice.w@student.intellisight.edu",
    "Camara_Id": 1,
    "Zone_id": 1
  }'
```

### Upload Face Picture for Student
```bash
curl -X POST http://localhost:3000/api/students/1/face-picture \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "Face_Pictures": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }'
```

---

## TimeTable - Entry/Exit Tracking

### Record Entry Event (Student)
```bash
curl -X POST http://localhost:3000/api/timetable/entry \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "personType": "STUDENT",
    "personId": 1,
    "zoneId": 1,
    "cameraId": 1
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "TimeTable_ID": 15,
    "EntryTime": "2025-11-19T10:30:00.000Z",
    "ExitTime": null,
    "PersonType": "STUDENT",
    "Student_ID": 1,
    "Zone_id": 1,
    "student": {
      "Name": "Alice Williams",
      "Email": "alice.w@student.intellisight.edu"
    },
    "zone": {
      "Zone_Name": "Main Building - Floor 1"
    }
  },
  "message": "Entry recorded successfully"
}
```

### Record Entry Event (Teacher)
```bash
curl -X POST http://localhost:3000/api/timetable/entry \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "personType": "TEACHER",
    "personId": 1,
    "zoneId": 2,
    "cameraId": 3
  }'
```

### Record Exit Event
```bash
curl -X POST http://localhost:3000/api/timetable/exit \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "personType": "STUDENT",
    "personId": 1,
    "zoneId": 1
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "TimeTable_ID": 15,
    "EntryTime": "2025-11-19T10:30:00.000Z",
    "ExitTime": "2025-11-19T12:45:00.000Z",
    "PersonType": "STUDENT",
    "Student_ID": 1,
    "Zone_id": 1
  },
  "message": "Exit recorded successfully"
}
```

### Get Currently Active Persons
```bash
curl -X GET http://localhost:3000/api/timetable/active \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "count": 3,
    "activePersons": [
      {
        "TimeTable_ID": 16,
        "EntryTime": "2025-11-19T09:00:00.000Z",
        "ExitTime": null,
        "PersonType": "TEACHER",
        "Teacher_ID": 2,
        "teacher": {
          "Name": "Prof. Robert Johnson",
          "Email": "robert.johnson@intellisight.edu"
        },
        "zone": {
          "Zone_Name": "Main Building - Floor 2"
        }
      }
    ]
  },
  "message": "Active persons retrieved successfully"
}
```

### Query TimeTable Entries

#### All Entries (Paginated)
```bash
curl -X GET "http://localhost:3000/api/timetable?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Filter by Zone
```bash
curl -X GET "http://localhost:3000/api/timetable?zoneId=1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Filter by Person Type
```bash
curl -X GET "http://localhost:3000/api/timetable?personType=STUDENT" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Filter by Specific Person
```bash
curl -X GET "http://localhost:3000/api/timetable?personType=STUDENT&personId=1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Filter by Date Range
```bash
curl -X GET "http://localhost:3000/api/timetable?from=2025-11-19T00:00:00Z&to=2025-11-19T23:59:59Z" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Combined Filters
```bash
curl -X GET "http://localhost:3000/api/timetable?zoneId=1&personType=STUDENT&from=2025-11-19T00:00:00Z&to=2025-11-19T23:59:59Z&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "TimeTable_ID": 15,
      "EntryTime": "2025-11-19T10:30:00.000Z",
      "ExitTime": "2025-11-19T12:45:00.000Z",
      "PersonType": "STUDENT",
      "student": {
        "Name": "Alice Williams",
        "Email": "alice.w@student.intellisight.edu"
      },
      "zone": {
        "Zone_Name": "Main Building - Floor 1"
      },
      "admin": {
        "Name": "John Administrator"
      }
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  },
  "message": "Timetable entries retrieved successfully"
}
```

### Get Analytics Dashboard
```bash
curl -X GET http://localhost:3000/api/timetable/analytics \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "totalEntriesToday": 42,
    "activeNow": 5,
    "entriesByZone": [
      {
        "Zone_id": 1,
        "_count": 15
      },
      {
        "Zone_id": 2,
        "_count": 12
      }
    ],
    "entriesByPersonType": [
      {
        "PersonType": "STUDENT",
        "_count": 30
      },
      {
        "PersonType": "TEACHER",
        "_count": 12
      }
    ]
  },
  "message": "Analytics data retrieved successfully"
}
```

---

## Error Examples

### Unauthorized (No Token)
```bash
curl -X GET http://localhost:3000/api/zones
```

**Response:**
```json
{
  "success": false,
  "message": "Authentication token required"
}
```

### Validation Error
```bash
curl -X POST http://localhost:3000/api/zones \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Response:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "body.Zone_Name",
      "message": "Required"
    }
  ]
}
```

### Not Found Error
```bash
curl -X GET http://localhost:3000/api/zones/999999 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response:**
```json
{
  "success": false,
  "message": "Zone with ID 999999 not found"
}
```

### Conflict Error (Duplicate Entry)
```bash
# First entry
curl -X POST http://localhost:3000/api/timetable/entry \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"personType": "STUDENT", "personId": 1, "zoneId": 1}'

# Duplicate entry (without exit)
curl -X POST http://localhost:3000/api/timetable/entry \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"personType": "STUDENT", "personId": 1, "zoneId": 1}'
```

**Response:**
```json
{
  "success": false,
  "message": "STUDENT #1 already has an active entry at Zone #1. Please record exit first..."
}
```

---

## Health Check

```bash
curl -X GET http://localhost:3000/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2025-11-19T10:30:00.000Z",
    "database": "connected"
  }
}
```
