# IntelliSight - Zone-Based Face Recognition System

## 🎯 System Overview

This is a **zone-based tracking system** that detects which zone a person is currently in, rather than logging attendance or entry/exit events.

### What It Does
- ✅ Detects faces in real-time from webcam/IP camera
- ✅ Recognizes students and teachers
- ✅ Tracks which **zone** each person is in
- ✅ Sends zone presence updates to backend
- ✅ Handles offline mode with auto-sync
- ✅ **NO attendance logging** - only zone tracking

### Key Difference from Entry/Exit System
| Feature | Zone Tracking | Entry/Exit Tracking |
|---------|--------------|---------------------|
| Purpose | Track current location | Log attendance |
| API Endpoint | `POST /api/timetable/zone` | `POST /api/timetable/entry` |
| Payload | Zone presence only | Entry/exit timestamps |
| Updates | Periodic (every 60s) | On appear/disappear |
| Use Case | Room occupancy, location tracking | Attendance, work hours |

---

## 📋 Requirements

### Hardware
- Python 3.8+
- Webcam or IP camera
- Windows/Ubuntu/Raspberry Pi

### Software
```bash
pip install opencv-python face-recognition numpy requests imutils python-dotenv
```

---

## 🚀 Quick Start (Zone Tracking)

### Step 1: Install Dependencies

```powershell
cd face-recognition
pip install -r requirements.txt
```

### Step 2: Configure Environment

```powershell
copy .env.example .env
```

**Edit `.env` for zone tracking:**
```env
DEFAULT_ZONE_ID=1              # Zone this camera is monitoring
ZONE_UPDATE_INTERVAL=60.0      # Send zone update every 60 seconds
```

### Step 3: Collect Training Images

```powershell
# Same as before - capture images for each person
python capture_images.py --person student_1 --count 10
python capture_images.py --person student_2 --count 10
python capture_images.py --person teacher_1 --count 10
```

### Step 4: Train Model

```powershell
python train_encodings.py --validate
```

### Step 5: Run Zone Tracking

```powershell
# Make sure backend is running first!
cd ..
npm run dev

# In another terminal - start zone tracking
cd face-recognition
python live_zone_tracking.py --zone 1
```

---

## 📡 Backend Integration - Zone Endpoint

### API Endpoint

```
POST /api/timetable/zone
```

### Request Payload

```json
{
  "personType": "STUDENT",
  "personId": 5,
  "zoneId": 2,
  "timestamp": "2025-01-01T12:01:00"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "message": "Zone updated successfully",
    "personType": "STUDENT",
    "personId": 5,
    "zoneId": 2,
    "timestamp": "2025-01-01T12:01:00"
  }
}
```

### Update Logic

1. **Person appears in camera view** → Send zone update
2. **Person already in zone** → Send update every 60 seconds (configurable)
3. **Person moves to different zone** → Send immediate update
4. **Person disappears** → Stop sending updates (no exit event)

---

## 🎮 Using the Zone Tracking System

### Command Line Options

```bash
# Basic usage (Zone 1)
python live_zone_tracking.py

# Specify zone ID
python live_zone_tracking.py --zone 2

# Change update interval (30 seconds)
python live_zone_tracking.py --zone 1 --update-interval 30.0

# Use different camera
python live_zone_tracking.py --camera 1 --zone 1

# Use Haar Cascade (faster)
python live_zone_tracking.py --method haar --zone 1
```

### Keyboard Controls

- `q` - Quit application
- `s` - Manually sync offline entries
- `r` - Reset tracker (clear all active persons)

### What You'll See

The camera window shows:
- ✅ Green boxes around recognized faces
- ✅ Person labels (STUDENT_1, TEACHER_2, etc.)
- ✅ Current zone being tracked
- ✅ FPS counter
- ✅ Active person count
- ✅ Backend connection status

### Console Output

```
Starting live zone tracking...
Tracking Zone: 1
✅ Camera opened successfully

📍 Zone update needed: STUDENT_1 → Zone 1
✅ Zone update sent: STUDENT_1 in Zone 1

📍 Zone update needed: TEACHER_1 → Zone 1
✅ Zone update sent: TEACHER_1 in Zone 1

# After 60 seconds...
📍 Zone update needed: STUDENT_1 → Zone 1
✅ Zone update sent: STUDENT_1 in Zone 1 (periodic update)
```

---

## 🏢 Multi-Zone Setup

### Scenario: Track 3 Different Zones

**Zone 1: Main Entrance**
```powershell
# Terminal 1
python live_zone_tracking.py --camera 0 --zone 1
```

**Zone 2: Science Lab**
```powershell
# Terminal 2
python live_zone_tracking.py --camera 1 --zone 2
```

**Zone 3: Library**
```powershell
# Terminal 3
python live_zone_tracking.py --camera 2 --zone 3
```

### Using IP Cameras (RTSP)

Edit `.env`:
```env
# Zone 1: Entrance camera
CAMERA_SOURCE=rtsp://admin:pass@192.168.1.100:554/stream
DEFAULT_ZONE_ID=1

# Or specify on command line
python live_zone_tracking.py --zone 1
# (will use CAMERA_SOURCE from .env)
```

---

## 🔄 Zone Update Logic

### When Updates Are Sent

```python
# Scenario 1: Person first appears
STUDENT_1 detected → Send zone update immediately

# Scenario 2: Person still in same zone
STUDENT_1 in Zone 1 for 60 seconds → Send periodic update

# Scenario 3: Person changes zones
STUDENT_1 moves from Zone 1 to Zone 2
→ Zone 2 camera sends immediate update

# Scenario 4: Person leaves zone
STUDENT_1 disappears → No update sent (just stop tracking)
```

### Update Interval Configuration

```env
# Send updates every 60 seconds
ZONE_UPDATE_INTERVAL=60.0

# Send updates every 30 seconds (more frequent)
ZONE_UPDATE_INTERVAL=30.0

# Send updates every 5 minutes (less frequent)
ZONE_UPDATE_INTERVAL=300.0
```

### Avoiding Duplicate Updates

The system automatically prevents:
- ❌ Multiple updates for same person in same zone within interval
- ❌ Sending updates when person not actually in zone
- ❌ Duplicate updates if camera temporarily loses sight

---

## 📊 Monitoring Zone Occupancy

### Get Current Zone Occupancy (Backend API)

```powershell
# Login
$body = '{"email":"john.admin@intellisight.com","password":"admin123"}'
$login = Invoke-RestMethod -Uri http://localhost:3000/api/auth/login -Method Post -Body $body -ContentType 'application/json'
$token = $login.data.token

# Get persons in Zone 1
$headers = @{Authorization="Bearer $token"}
$zone1 = Invoke-RestMethod -Uri "http://localhost:3000/api/timetable/zone/1" -Headers $headers

# Display results
$zone1.data | Format-Table PersonType, PersonId, LastUpdate
```

### Expected Output

```
PersonType PersonId LastUpdate
---------- -------- ----------
STUDENT    1        2025-01-15T14:30:00
STUDENT    5        2025-01-15T14:29:00
TEACHER    2        2025-01-15T14:28:00
```

---

## 🆚 Comparison: Zone Tracking vs Entry/Exit

### Use Zone Tracking When:
✅ You need to know **where** people are right now
✅ Tracking room occupancy or capacity
✅ Security monitoring (who's in which area)
✅ Resource allocation (assign tasks based on location)
✅ Emergency evacuation (know who's in each zone)

### Use Entry/Exit Tracking When:
✅ You need to know **when** people arrived/left
✅ Attendance logging for classes/work
✅ Time tracking for payroll
✅ Access control with audit trail
✅ Building entry/exit logs

### Files Comparison

| Zone Tracking | Entry/Exit Tracking |
|--------------|---------------------|
| `live_zone_tracking.py` | `live_recognition.py` |
| `send_zone_to_backend.py` | `send_to_backend.py` |
| `POST /api/timetable/zone` | `POST /api/timetable/entry` |
| Periodic updates | Event-driven updates |
| No exit tracking | Entry + Exit events |

---

## 🔧 Configuration Guide

### `.env` File (Zone Tracking)

```env
# Backend Configuration
BACKEND_URL=http://localhost:3000
API_BASE_URL=http://localhost:3000/api
ADMIN_EMAIL=john.admin@intellisight.com
ADMIN_PASSWORD=admin123

# Zone Settings - IMPORTANT FOR ZONE TRACKING
DEFAULT_ZONE_ID=1                  # Which zone is this camera monitoring?
ZONE_UPDATE_INTERVAL=60.0          # How often to send updates (seconds)

# Recognition Settings
RECOGNITION_TOLERANCE=0.6          # Lower = stricter matching
DETECTION_METHOD=dnn               # haar (fast) or dnn (accurate)

# Camera Settings
CAMERA_SOURCE=0                    # Webcam index or RTSP URL
CAMERA_WIDTH=640
CAMERA_HEIGHT=480

# Performance
PROCESS_EVERY_N_FRAMES=2           # Process every 2nd frame
RESIZE_SCALE=0.25                  # Resize to 25% for faster processing

# Offline Mode
ENABLE_OFFLINE_MODE=true
OFFLINE_LOG_FILE=logs/offline_zones.json
SYNC_INTERVAL=30                   # Sync every 30 seconds
```

---

## 🐛 Troubleshooting

### "Zone updates not being sent"

**Check:**
1. Backend is running: `curl http://localhost:3000/health`
2. Logged in successfully (check console for "✅ Login successful")
3. Person is recognized (not showing as "Unknown")
4. Update interval hasn't elapsed yet

**Solution:**
```bash
# Force immediate update by restarting
python live_zone_tracking.py --zone 1
```

### "Too many zone updates"

**Problem:** Updates sent too frequently

**Solution:** Increase update interval in `.env`:
```env
ZONE_UPDATE_INTERVAL=120.0  # Update every 2 minutes instead
```

### "Person not detected in zone"

**Check:**
1. Person's face is visible in camera
2. Good lighting conditions
3. Person is in the training dataset
4. Recognition tolerance not too strict

**Solution:**
```bash
# Use more lenient tolerance
python live_zone_tracking.py --tolerance 0.7 --zone 1
```

### "Offline entries not syncing"

**Check:**
```powershell
# View offline entries
Get-Content face-recognition\logs\offline_zones.json

# Check sync interval
# Updates sync automatically every 30 seconds when backend reconnects
```

**Manual sync:**
Press `s` key in the camera window

---

## 📝 Complete File Reference

### Zone Tracking Scripts

1. **`live_zone_tracking.py`** (main script)
   - Real-time face recognition
   - Zone presence tracking
   - Periodic zone updates
   - Offline mode support

2. **`send_zone_to_backend.py`**
   - Backend API integration
   - `POST /api/timetable/zone` endpoint
   - JWT authentication
   - Offline caching and auto-sync

3. **`train_encodings.py`** (same as entry/exit system)
   - Load images from dataset
   - Generate face encodings
   - Save to `models/encodings.pickle`

4. **`capture_images.py`** (same as entry/exit system)
   - Capture training images from webcam
   - Face detection preview
   - Auto-naming and counting

5. **`utils.py`** (same as entry/exit system)
   - Face detector (Haar/DNN)
   - FPS counter
   - Configuration loader
   - Logging utilities

---

## 📚 Example Workflows

### Workflow 1: Single Zone Monitoring

```bash
# 1. Setup
cd face-recognition
copy .env.example .env
# Edit .env: DEFAULT_ZONE_ID=1

# 2. Collect data
python capture_images.py --person student_1 --count 10
python capture_images.py --person student_2 --count 10

# 3. Train
python train_encodings.py

# 4. Run backend
cd ..
npm run dev

# 5. Start zone tracking
cd face-recognition
python live_zone_tracking.py
```

### Workflow 2: Multi-Zone Tracking

```bash
# Terminal 1: Zone 1 (Entrance)
python live_zone_tracking.py --camera 0 --zone 1

# Terminal 2: Zone 2 (Lab)
python live_zone_tracking.py --camera 1 --zone 2

# Terminal 3: Zone 3 (Library)
python live_zone_tracking.py --camera 2 --zone 3
```

### Workflow 3: RTSP Camera Setup

```bash
# 1. Edit .env for Zone 1
CAMERA_SOURCE=rtsp://admin:password@192.168.1.100:554/stream
DEFAULT_ZONE_ID=1

# 2. Run
python live_zone_tracking.py

# 3. For another zone, create .env.zone2
CAMERA_SOURCE=rtsp://admin:password@192.168.1.101:554/stream
DEFAULT_ZONE_ID=2

# 4. Run with custom config
cp .env.zone2 .env
python live_zone_tracking.py
```

---

## ✅ Success Checklist

**Setup:**
- [ ] Python dependencies installed
- [ ] `.env` configured with correct zone ID
- [ ] Training images collected (5-10 per person)
- [ ] Face encodings trained successfully
- [ ] Backend running on port 3000

**Zone Tracking:**
- [ ] Camera opens and shows live feed
- [ ] Faces detected with green boxes
- [ ] Persons recognized (not "Unknown")
- [ ] Zone ID shown in window title
- [ ] Console shows "📍 Zone update needed"
- [ ] Console shows "✅ Zone update sent"
- [ ] Backend receives zone updates

**Multi-Zone (Optional):**
- [ ] Multiple camera instances running
- [ ] Each monitoring different zone
- [ ] Zone updates going to correct zones
- [ ] No conflicts between instances

---

## 🎯 Summary

This zone tracking system:
- ✅ **Tracks location**, not attendance
- ✅ **Sends zone presence** to backend every 60 seconds
- ✅ **No entry/exit events** - only "person is in zone X"
- ✅ **Handles offline** - caches and syncs when online
- ✅ **Supports multiple zones** - run multiple instances
- ✅ **Production-ready** - error handling, logging, monitoring

**Key Differences:**
- Updates are **periodic** (every 60s), not event-driven
- No "exit" concept - just stop sending updates
- Focuses on **current location**, not movement history
- Better for **occupancy tracking** than attendance

---

## 📞 Support

For issues:
1. Check logs: `face-recognition/logs/system.log`
2. Test backend: `http://localhost:3000/health`
3. Verify zone configuration in `.env`
4. Review console output for error messages

For complete backend integration, see main `README.md`.

---

**IntelliSight Zone Tracking System** - Know where everyone is, in real-time! 📍
