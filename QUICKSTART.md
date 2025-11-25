# IntelliSight Backend - Quick Start Guide

# IntelliSight - Complete System Quick Start Guide

## ⚡ Get the Full System Running in 15 Minutes

This guide covers setting up both the Node.js backend AND Python face recognition system.

---

## 🎯 What You'll Build

A complete facial recognition access control system with:
- ✅ Backend API (Node.js + PostgreSQL)
- ✅ Real-time face recognition (Python + OpenCV)
- ✅ Automatic entry/exit tracking
- ✅ Offline mode with auto-sync

---

## Part 1: Backend Setup (5 minutes)

### Step 1: Install Backend Dependencies

```powershell
cd d:\FYPprojectIntelisight
npm install
```

### Step 2: Setup Environment

```powershell
copy .env.example .env
```

### Step 3: Ensure PostgreSQL is Running

```powershell
# Check if PostgreSQL is running on port 5000
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue

# If not running, start PostgreSQL service
Start-Service postgresql-x64-15
```

### Step 4: Generate Prisma Client & Migrate

```powershell
npx prisma generate
npx prisma migrate dev --name init
```

### Step 5: Seed Sample Data

```powershell
npm run seed
```

**Expected output:**
```
✅ Created 3 admins
✅ Created 5 zones, 6 cameras, 5 teachers, 8 students
🔑 Test Admin: john.admin@intellisight.com / admin123
```

### Step 6: Start Backend Server

```powershell
npm run dev
```

**Server now running on:** `http://localhost:3000`

Keep this terminal open!

---

## Part 2: Face Recognition Setup (10 minutes)

### Step 1: Install Python Dependencies

**Open a NEW PowerShell window:**

```powershell
cd d:\FYPprojectIntelisight\face-recognition
pip install -r requirements.txt
```

⏱️ **Note:** This may take 5-10 minutes (dlib needs to compile)

**If dlib fails:**
```powershell
# Install CMake first
choco install cmake

# Install Visual Studio Build Tools
# Download from: https://visualstudio.microsoft.com/downloads/
# Select: "Desktop development with C++"

# Then retry
pip install -r requirements.txt
```

### Step 2: Configure Face Recognition

```powershell
copy .env.example .env
```

Default settings work out-of-the-box! No changes needed.

### Step 3: Collect Training Images

**Capture images for 3 people (students 1-2, teacher 1):**

```powershell
# Student 1
python capture_images.py --person student_1 --count 10

# Student 2
python capture_images.py --person student_2 --count 10

# Teacher 1
python capture_images.py --person teacher_1 --count 10
```

**During capture:**
1. Face the camera
2. Press `SPACE` when you see a green box (face detected)
3. Move slightly, press `SPACE` again
4. Repeat 10 times
5. Press `ESC` when done

**Tips:**
- Good lighting is important
- Look at camera from different angles
- Include both smiling and neutral expressions

### Step 4: Train Face Recognition Model

```powershell
python train_encodings.py --validate
```

**Expected output:**
```
Processing STUDENT_1 (10 images)...
✅ STUDENT_1: 10/10 images processed successfully
...
✅ Training Complete!
Total encodings: 30
```

### Step 5: Start Live Recognition

```powershell
python live_recognition.py
```

**A camera window will open showing:**
- Live video feed
- Green boxes around recognized faces
- Person labels (STUDENT_1, TEACHER_1, etc.)
- FPS counter
- Backend connection status

---

## Part 3: Test the Complete System (2 minutes)

### Verify Entry Tracking

1. **Stand in front of camera**
   - You should see: Green box + "STUDENT_1" label
   - Console shows: `👋 NEW ENTRY: STUDENT_1`
   - Console shows: `✅ Entry logged: STUDENT_1`

2. **Move away from camera**
   - Wait 3 seconds
   - Console shows: `👋 NEW EXIT: STUDENT_1`
   - Console shows: `✅ Exit logged: STUDENT_1`

### Verify in Database

**Open a THIRD PowerShell window:**

```powershell
# Login to backend
$body = '{"email":"john.admin@intellisight.com","password":"admin123"}'
$login = Invoke-RestMethod -Uri http://localhost:3000/api/auth/login -Method Post -Body $body -ContentType 'application/json'
$token = $login.data.token

# Get active persons
$headers = @{Authorization="Bearer $token"}
$active = Invoke-RestMethod -Uri http://localhost:3000/api/timetable/active -Headers $headers

# Display results
$active.data | Format-Table
```

**Expected output:**
```
EntryTime           PersonType FirstName LastName Zone_Name
---------           ---------- --------- -------- ---------
2024-01-15 14:30:00 STUDENT    Student1  Name     Main Hall
```

✅ **Success!** Your complete IntelliSight system is operational!

---

## 🎮 Daily Usage

### Starting the System

**Terminal 1 - Backend:**
```powershell
cd d:\FYPprojectIntelisight
npm run dev
```

**Terminal 2 - Face Recognition:**
```powershell
cd d:\FYPprojectIntelisight\face-recognition
python live_recognition.py
```

### Adding More People

```powershell
cd face-recognition

# Capture images
python capture_images.py --person student_5 --count 10

# Retrain model
python train_encodings.py

# Restart recognition (press 'q' in camera window, then rerun)
python live_recognition.py
```

### Keyboard Controls (in camera window)

- `q` - Quit
- `s` - Manually sync offline entries
- `r` - Reset tracker (clear all active persons)

---

## 🔧 Troubleshooting

### Backend Issues

**"Can't reach database server"**
```powershell
# Check PostgreSQL is running
Get-Service postgresql*
Start-Service postgresql-x64-15
```

**"Port 3000 already in use"**
```powershell
# Change port in .env
# PORT=3001
```

### Face Recognition Issues

**"dlib failed to install"**
```powershell
# Install requirements first:
# 1. CMake: choco install cmake
# 2. Visual Studio Build Tools with C++ support
# Then retry: pip install dlib
```

**"No faces detected during training"**
- Ensure good lighting
- Face should be clearly visible (not too far)
- Try: `python train_encodings.py --method cnn`

**"Camera not found"**
```powershell
# Try different camera index
python live_recognition.py --camera 1
```

**"Backend connection failed"**
- Check backend is running: `curl http://localhost:3000/health`
- Verify credentials in `face-recognition/.env`
- System will save offline and sync when backend reconnects

**"Unknown person recognized"**
1. Collect more training images (10-15 per person)
2. Retrain: `python train_encodings.py`
3. Lower tolerance: Edit `.env` → `RECOGNITION_TOLERANCE=0.5`

---

## 📊 Monitoring

### View System Logs

```powershell
# Backend logs (in npm run dev terminal)
# Face recognition logs
Get-Content face-recognition\logs\system.log -Tail 20

# Offline entries (if backend was down)
Get-Content face-recognition\logs\offline_entries.json
```

### Database GUI

```powershell
npx prisma studio
# Opens at http://localhost:5555
# Browse all tables visually
```

### API Monitoring

```powershell
# Get active persons
Invoke-RestMethod -Uri http://localhost:3000/api/timetable/active -Headers @{Authorization="Bearer $token"}

# Get analytics
Invoke-RestMethod -Uri http://localhost:3000/api/timetable/analytics -Headers @{Authorization="Bearer $token"}
```

---

## 📈 Performance Tuning

### For Faster Recognition

Edit `face-recognition/.env`:
```env
DETECTION_METHOD=haar          # Faster than dnn
PROCESS_EVERY_N_FRAMES=3       # Process fewer frames
RESIZE_SCALE=0.20              # More aggressive resize
```

### For Better Accuracy

```env
DETECTION_METHOD=dnn           # More accurate
RECOGNITION_TOLERANCE=0.5      # Stricter matching
PROCESS_EVERY_N_FRAMES=1       # Process every frame
```

---

## 📚 Next Steps

### 1. Configure Multiple Cameras

```powershell
# Terminal 1: Entrance camera (Zone 1)
python live_recognition.py --camera 0 --zone 1

# Terminal 2: Exit camera (Zone 2)
python live_recognition.py --camera 1 --zone 2
```

### 2. Use IP Cameras (RTSP)

Edit `face-recognition/.env`:
```env
CAMERA_SOURCE=rtsp://username:password@192.168.1.100:554/stream
```

### 3. Production Deployment

See full documentation:
- Backend: `README.md`, `DEPLOYMENT.md`
- Face Recognition: `face-recognition/README.md`

### 4. Import Postman Collection

- Open Postman
- Import `postman_collection.json`
- Test all API endpoints interactively

---

## 📝 Key Files & Documentation

### Backend
- `README.md` - Complete backend guide
- `SAMPLE_REQUESTS.md` - API examples
- `TESTING.md` - Testing guide

### Face Recognition
- `face-recognition/README.md` - Complete face recognition guide
- `face-recognition/QUICKSTART.md` - Face recognition quick start
- `face-recognition/dataset/README.md` - Dataset guidelines

---

## ✅ Success Checklist

**Backend:**
- [ ] PostgreSQL running on port 5000
- [ ] npm install completed
- [ ] Prisma migrations applied
- [ ] Database seeded with sample data
- [ ] Server running on port 3000
- [ ] Health endpoint returns OK

**Face Recognition:**
- [ ] Python dependencies installed (including dlib)
- [ ] Training images collected (5-10 per person)
- [ ] Face encodings trained successfully
- [ ] Camera opens and shows live feed
- [ ] Faces detected and recognized
- [ ] Entries logged to backend
- [ ] Exits detected after 3 seconds

---

## 🎯 Quick Command Reference

```powershell
# Backend
npm run dev              # Start backend server
npm test                 # Run all tests
npm run seed             # Reseed database
npx prisma studio        # Database GUI

# Face Recognition
python capture_images.py --person student_1 --count 10
python train_encodings.py --validate
python live_recognition.py
python send_to_backend.py  # Test backend integration
```

---

## 🆘 Getting Help

1. Check logs: `face-recognition/logs/system.log`
2. Test backend health: `http://localhost:3000/health`
3. Verify database: `npx prisma studio`
4. Review full documentation in respective README files

---

## 💡 Pro Tips

- **Testing**: Start with 1-2 people before scaling up
- **Lighting**: Good lighting = better recognition
- **Training**: More images (10-15) = better accuracy
- **Offline mode**: System continues working even if backend is down
- **Multiple zones**: Run multiple recognition instances for different areas

---

**🎉 Congratulations!** Your IntelliSight system is ready for facial recognition and access control!

---

## Part 1: Backend Setup (5 minutes)

Open PowerShell and navigate to the project:

```powershell
cd d:\FYPprojectIntelisight
npm install
```

**Expected output:** All packages installed successfully (may take 2-3 minutes)

---

## Step 2: Setup Environment

```powershell
cp .env.example .env
```

The `.env` file is already configured for your local PostgreSQL setup (port 5000).

**No changes needed** if your PostgreSQL credentials match:
- User: `postgres`
- Password: `zeeshan`
- Port: `5000`
- Database: `FYP_Intellisight`

---

## Step 3: Ensure PostgreSQL is Running

```powershell
# Check if PostgreSQL is running on port 5000
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue

# If not running, start PostgreSQL service
# (Adjust service name based on your installation)
Start-Service postgresql-x64-15
```

---

## Step 4: Generate Prisma Client

```powershell
npx prisma generate
```

**Expected output:** `✔ Generated Prisma Client`

---

## Step 5: Create Database Tables

```powershell
npx prisma migrate dev --name init
```

**Expected output:** 
```
✔ Prisma Migrate created the following migration(s) from new schema changes:
  migrations/
    └─ 20251119_init/
       └─ migration.sql
```

---

## Step 6: Seed Sample Data

```powershell
npm run seed
```

**Expected output:**
```
🌱 Starting database seeding...
✅ Created 3 admins
✅ Created 5 zones
✅ Created 6 cameras
✅ Created 5 teachers
✅ Created 8 students
✅ Created 10 timetable entries
🎉 Database seeding completed successfully!

🔑 Test Admin Credentials:
   Email: john.admin@intellisight.com
   Password: admin123
```

---

## Step 7: Start the Server

```powershell
npm run dev
```

**Expected output:**
```
✅ Database connected successfully
🚀 Server running on port 3000
📡 Environment: development
🔗 Health check: http://localhost:3000/health
📚 API base URL: http://localhost:3000/api
```

---

## Step 8: Test the API

Open a new PowerShell window and test:

```powershell
# Health check
curl http://localhost:3000/health

# Login (get JWT token)
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"john.admin@intellisight.com","password":"admin123"}'

# Save token
$token = $response.data.token

# Get all zones (authenticated request)
Invoke-RestMethod -Uri "http://localhost:3000/api/zones" -Headers @{Authorization="Bearer $token"}
```

---

## ✅ You're Ready!

Your backend is now running on `http://localhost:3000`

### Default Test Account
- **Email:** john.admin@intellisight.com
- **Password:** admin123

### Next Steps

1. **Import Postman Collection:**
   - Open Postman
   - Import `postman_collection.json`
   - Set baseUrl to `http://localhost:3000`
   - Login to get token (automatically saved)
   - Test all endpoints

2. **Read Documentation:**
   - `README.md` - Complete setup guide
   - `SAMPLE_REQUESTS.md` - All curl examples
   - `DEPLOYMENT.md` - Production deployment guide

3. **Run Tests:**
   ```powershell
   npm test
   ```

4. **Open Prisma Studio (Database GUI):**
   ```powershell
   npx prisma studio
   ```
   Opens at `http://localhost:5555`

---

## 🔧 Troubleshooting

### "Port 5000 is already in use"
Your PostgreSQL is running correctly! Proceed to next step.

### "Can't reach database server"
```powershell
# Check PostgreSQL service status
Get-Service postgresql*

# Start if stopped
Start-Service postgresql-x64-15
```

### "Prisma Client not found"
```powershell
npx prisma generate
```

### "EADDRINUSE: Port 3000 already in use"
```powershell
# Kill process on port 3000
$process = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($process) {
    Stop-Process -Id $process.OwningProcess -Force
}

# Or change PORT in .env
# PORT=3001
```

---

## 📝 Common Commands

```powershell
# Development server (auto-reload)
npm run dev

# Production server
npm start

# Run tests
npm test

# Seed database
npm run seed

# Database GUI
npx prisma studio

# View migration status
npx prisma migrate status

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset
```

---

## 🎯 Key API Endpoints

```
POST   /api/auth/register        - Register admin
POST   /api/auth/login           - Login
GET    /api/zones                - List zones
POST   /api/zones                - Create zone
GET    /api/students             - List students
POST   /api/students             - Create student
POST   /api/timetable/entry      - Record entry
POST   /api/timetable/exit       - Record exit
GET    /api/timetable/active     - Active persons
GET    /api/timetable/analytics  - Dashboard data
```

All endpoints except `/auth/register` and `/auth/login` require JWT token in `Authorization: Bearer <token>` header.

---

## 💡 Tips

- Use Postman collection for easier testing
- Check `SAMPLE_REQUESTS.md` for example payloads
- JWT tokens expire after 7 days (configurable in .env)
- Default admin password: `admin123` (change in production!)
- Face pictures: send as base64 with `data:image/...;base64,` prefix

---

**Happy coding! 🚀**
