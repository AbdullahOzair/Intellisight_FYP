# IntelliSight Face Recognition - Quick Start Guide

Get up and running with the face recognition system in 5 minutes!

## 🚀 Prerequisites

- ✅ Node.js backend running on `http://localhost:3000`
- ✅ PostgreSQL database seeded with students/teachers
- ✅ Python 3.8+ installed
- ✅ Webcam connected

## 📦 Installation (One-Time Setup)

### Windows

```powershell
cd face-recognition

# Install dependencies
pip install -r requirements.txt
```

⏱️ **Time**: 5-10 minutes (dlib may take time to compile)

### Linux/Ubuntu

```bash
cd face-recognition

# Install system dependencies
sudo apt-get update
sudo apt-get install -y python3-pip cmake build-essential

# Install Python packages
pip3 install -r requirements.txt
```

## 🎯 Quick Start (3 Steps)

### Step 1: Configure Environment

```powershell
# Copy environment template
copy .env.example .env
```

The default settings work out-of-the-box! Edit only if needed.

### Step 2: Collect Training Images

**Option A: Use Capture Tool (Recommended)**

```powershell
# Capture 10 images for student ID 1
python capture_images.py --person student_1 --count 10

# Capture 10 images for student ID 2
python capture_images.py --person student_2 --count 10

# Capture 10 images for teacher ID 1
python capture_images.py --person teacher_1 --count 10
```

**Instructions during capture:**
1. Look at camera
2. Press `SPACE` when face is detected (green box)
3. Move slightly, press `SPACE` again
4. Repeat until 10 images captured
5. Press `ESC` when done

**Option B: Manual Images**

```powershell
# Create folders manually
mkdir dataset\student_1
mkdir dataset\student_2

# Copy 5-10 images per person into respective folders
```

### Step 3: Train & Run

```powershell
# Train face encodings (takes 30 seconds)
python train_encodings.py

# Start live recognition
python live_recognition.py
```

✅ **Done!** The system is now recognizing faces and logging to backend.

## 🎮 Using the System

### Live Recognition Window

You'll see:
- ✅ Green boxes around recognized faces
- ✅ Person labels (e.g., "STUDENT_1", "TEACHER_2")
- ✅ FPS counter
- ✅ Active person count
- ✅ Backend connection status

### Keyboard Controls

- `q` - Quit application
- `s` - Sync offline entries
- `r` - Reset tracker

### What Happens Automatically

1. **Entry Detection**: Person appears → Entry logged to database
2. **Exit Detection**: Person disappears for 3 seconds → Exit logged
3. **Offline Mode**: If backend down → Saves locally, auto-syncs when back
4. **Duplicate Prevention**: Won't log multiple entries for same person

## 📊 Verify It's Working

### Check Database Entries

**Using PowerShell:**

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

**Expected Output:**
```
EntryTime           PersonType FirstName LastName
---------           ---------- --------- --------
2024-01-15 14:30:00 STUDENT    John      Doe
2024-01-15 14:31:00 TEACHER    Jane      Smith
```

### Check Logs

```powershell
# View system logs
Get-Content logs\system.log -Tail 20

# View offline entries (if any)
Get-Content logs\offline_entries.json
```

## 🎓 Testing Workflow

### Complete Test Scenario

1. **Prepare Test Person**
   ```powershell
   # Capture images for student_1
   python capture_images.py --person student_1 --count 10
   ```

2. **Train Model**
   ```powershell
   python train_encodings.py --validate
   ```

3. **Run Recognition**
   ```powershell
   python live_recognition.py
   ```

4. **Test Entry**
   - Stand in front of camera
   - Wait for green box + "STUDENT_1" label
   - Check console: Should see "NEW ENTRY: STUDENT_1"
   - Check console: Should see "✅ Entry logged: STUDENT_1"

5. **Test Exit**
   - Move away from camera
   - Wait 3 seconds
   - Check console: Should see "NEW EXIT: STUDENT_1"
   - Check console: Should see "✅ Exit logged: STUDENT_1"

6. **Verify in Database**
   ```powershell
   # Query backend for timetable
   Invoke-RestMethod -Uri http://localhost:3000/api/timetable/active -Headers @{Authorization="Bearer $token"}
   ```

## 🔧 Common Issues & Quick Fixes

### "dlib failed to install"

**Fix:**
```powershell
# Install Visual Studio Build Tools from:
# https://visualstudio.microsoft.com/downloads/

# Then retry:
pip install dlib
```

### "No faces detected during training"

**Fix:**
- Ensure good lighting
- Face should be clearly visible
- Try: `python train_encodings.py --method cnn`

### "Camera not found"

**Fix:**
```powershell
# Test different camera indices
python live_recognition.py --camera 0
python live_recognition.py --camera 1
```

### "Backend connection failed"

**Fix:**
```powershell
# Check backend is running
Invoke-RestMethod http://localhost:3000/health

# If not running, start it:
cd ..
npm start
```

### "Unknown person recognized"

**Fix:**
1. Collect more training images (10-15 per person)
2. Retrain: `python train_encodings.py`
3. Lower tolerance: Edit `.env` → `RECOGNITION_TOLERANCE=0.5`

## 📈 Performance Tips

### For Faster FPS

Edit `.env`:
```env
DETECTION_METHOD=haar          # Faster than dnn
PROCESS_EVERY_N_FRAMES=3       # Process fewer frames
RESIZE_SCALE=0.20              # More aggressive resize
CAMERA_WIDTH=480               # Lower resolution
CAMERA_HEIGHT=360
```

### For Better Accuracy

Edit `.env`:
```env
DETECTION_METHOD=dnn           # More accurate
RECOGNITION_TOLERANCE=0.5      # Stricter matching
PROCESS_EVERY_N_FRAMES=1       # Process every frame
```

## 🎯 Next Steps

After basic setup works:

1. **Add More People**
   ```powershell
   python capture_images.py --person student_3 --count 10
   python train_encodings.py
   ```

2. **Configure Multiple Cameras**
   ```powershell
   # Terminal 1: Camera at entrance (Zone 1)
   python live_recognition.py --camera 0 --zone 1

   # Terminal 2: Camera at exit (Zone 2)
   python live_recognition.py --camera 1 --zone 2
   ```

3. **Review Analytics**
   ```powershell
   # Get attendance statistics
   $analytics = Invoke-RestMethod -Uri http://localhost:3000/api/timetable/analytics -Headers @{Authorization="Bearer $token"}
   $analytics.data | Format-Table
   ```

4. **Production Deployment**
   - See main README for service setup
   - Configure RTSP cameras
   - Set up auto-start on boot

## 📚 Additional Resources

- **Full Documentation**: `README.md`
- **Dataset Guide**: `dataset/README.md`
- **Backend API**: `../TESTING.md`
- **System Logs**: `logs/system.log`

## ✅ Success Checklist

- [ ] Python dependencies installed
- [ ] `.env` file created
- [ ] Training images collected (5-10 per person)
- [ ] Model trained successfully
- [ ] Live recognition running
- [ ] Entries logged to database
- [ ] Exits detected correctly
- [ ] Backend connection working

## 🆘 Getting Help

1. Check `logs/system.log` for errors
2. Review troubleshooting in main README
3. Verify backend is running: `http://localhost:3000/health`
4. Test with single person first before multiple

---

**Ready to go!** Your IntelliSight face recognition system is now operational. 🎉
