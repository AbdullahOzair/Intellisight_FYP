# Zone 1 Live Tracking - Setup Guide

## 📋 Overview
This guide will help you set up and run the Zone 1 Live Face Recognition module for IntelliSight.

---

## 🔧 Prerequisites

1. **Node.js** (v16 or higher)
2. **PostgreSQL Database** (running and configured)
3. **Webcam** (laptop camera or external USB camera)
4. **Browser** with webcam permissions (Chrome/Edge recommended)

---

## 📦 Installation Steps

### 1. Install Frontend Dependencies

```powershell
cd D:\FYPprojectIntelisight\admin-dashboard
npm install face-api.js react-webcam
```

### 2. Download Face-API.js Models

Download the pre-trained models and place them in `public/models/`:

```powershell
# Create models directory
New-Item -Path "public/models" -ItemType Directory -Force

# Download models (you'll need to download these manually)
```

**Download these model files from:**
https://github.com/justadudewhohacks/face-api.js/tree/master/weights

**Required files:**
- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model-shard1`
- `face_landmark_68_model-weights_manifest.json`
- `face_landmark_68_model-shard1`
- `face_recognition_model-weights_manifest.json`
- `face_recognition_model-shard1`
- `face_recognition_model-shard2`
- `face_expression_model-weights_manifest.json`
- `face_expression_model-shard1`

Place all files in: `D:\FYPprojectIntelisight\admin-dashboard\public\models\`

### 3. Update Database Schema

```powershell
cd D:\FYPprojectIntelisight
npx prisma migrate dev --name add_unknown_faces
npx prisma generate
```

### 4. Restart Backend Server

```powershell
cd D:\FYPprojectIntelisight
npm run dev
```

### 5. Restart Frontend Dashboard

```powershell
cd D:\FYPprojectIntelisight\admin-dashboard
npm run dev
```

---

## 🎯 How to Use

### 1. Access Zone 1 Live Tracking

1. Login to the dashboard: http://localhost:3001
2. Click **"Zone 1 Live"** in the sidebar
3. Allow camera permissions when prompted

### 2. Face Recognition Flow

**When a person appears in front of the camera:**

1. **Face Detection** (automatic every 3 seconds)
   - Green box = Recognized person (in database)
   - Red box = Unknown person (not in database)

2. **Recognized Person:**
   - Name and confidence score shown
   - Automatically logged to Zone 1
   - Appears in "Currently in Zone 1" section
   - Added to Activity Log

3. **Unknown Person:**
   - Marked as "Unknown"
   - Face image captured and saved
   - Logged as unknown detection

### 3. Monitor Zone Activity

**Statistics Cards:**
- Currently in Zone: Live count
- Total Recognized: Session count
- Unknown Detected: Session count

**Live Activity Log:**
- Real-time entry/exit logs
- Person details and timestamps
- Auto-refreshes every 5 seconds

**Currently in Zone 1:**
- Grid of all persons inside
- Entry time and duration
- "Mark Exit" button for manual exit

---

## 🔍 Testing the System

### Test 1: Verify Camera Access
1. Open Zone 1 Live page
2. Check for "LIVE" indicator (green dot)
3. Verify video stream is working

### Test 2: Face Detection
1. Position your face in front of camera
2. Wait 3 seconds for detection
3. Verify bounding box appears

### Test 3: Face Recognition
1. Ensure your face is in the database
2. Stand in front of camera
3. Wait for green box with your name
4. Check if logged in "Currently in Zone 1"

### Test 4: Unknown Person Detection
1. Show a different face (not in database)
2. Wait for red box showing "Unknown"
3. Verify logged in unknown faces table

---

## 🛠️ Troubleshooting

### Issue 1: Camera not working
**Solution:**
- Check browser permissions (chrome://settings/content/camera)
- Try different browser (Chrome recommended)
- Check if camera is being used by another app
- Restart browser

### Issue 2: Models not loading
**Solution:**
- Verify models are in `public/models/` directory
- Check browser console for 404 errors
- Clear browser cache (Ctrl + Shift + Delete)
- Re-download model files

### Issue 3: No face detection
**Solution:**
- Ensure good lighting conditions
- Position face clearly in frame
- Check if models loaded successfully (browser console)
- Verify face-api.js installed: `npm list face-api.js`

### Issue 4: Low recognition accuracy
**Solution:**
- Improve lighting
- Position face directly facing camera
- Ensure database face images are clear
- Reduce matching threshold (currently 0.6)

### Issue 5: Backend API errors
**Solution:**
- Verify backend is running on port 3000
- Check PostgreSQL database is running
- Run: `npx prisma studio` to verify database
- Check backend logs for errors

---

## 📊 API Endpoints

### Recognize Person
```
POST /api/zones/1/recognize
Body: {
  "personId": 1,
  "personType": "STUDENT",
  "confidence": 0.95
}
```

### Log Unknown Person
```
POST /api/zones/1/unknown
Body: {
  "capturedImage": "data:image/jpeg;base64,...",
  "confidence": 0,
  "notes": "Detected by live camera"
}
```

### Get Current Persons
```
GET /api/zones/1/current
```

### Get Activity Logs
```
GET /api/zones/1/logs?limit=50&offset=0
```

### Get Face Database
```
GET /api/zones/1/face-database
```

### Mark Exit
```
PUT /api/zones/1/exit/:timetableId
```

---

## 🎨 Customization

### Adjust Detection Interval
In `Zone1.jsx`, line ~112:
```javascript
}, 3000); // Change to 2000 for faster detection (2 seconds)
```

### Adjust Recognition Threshold
In `Zone1.jsx`, line ~125:
```javascript
return faceRecognition.matchFace(detection.descriptor, 0.6);
// Lower value = stricter matching (0.5)
// Higher value = looser matching (0.7)
```

### Change Camera Resolution
In `LiveCameraFeed.jsx`, line ~17:
```javascript
const videoConstraints = {
  width: 1280,  // Higher resolution
  height: 720,
  facingMode: "user"
};
```

---

## 📝 Database Tables

### TimeTable (Entry/Exit Logs)
- TimeTable_ID
- EntryTime
- ExitTime
- PersonType (TEACHER/STUDENT)
- Teacher_ID or Student_ID
- Zone_id

### UnknownFaces (Unknown Detections)
- Unknown_ID
- Captured_Image (BYTEA)
- DetectedTime
- Zone_id
- Confidence
- Status (PENDING/IDENTIFIED/IGNORED)

---

## 🚀 Performance Tips

1. **Optimize Detection Interval:**
   - 3 seconds = balanced
   - 2 seconds = faster, more CPU usage
   - 5 seconds = slower, less CPU usage

2. **Reduce Video Resolution:**
   - 640x480 = fastest
   - 1280x720 = balanced
   - 1920x1080 = highest quality, slowest

3. **Limit Logs Display:**
   - Default: 20 logs
   - Reduce to 10 for better performance

4. **Database Optimization:**
   - Add indexes on frequently queried fields
   - Regularly archive old logs

---

## 📞 Support

If you encounter any issues:

1. Check browser console (F12) for errors
2. Check backend terminal for API errors
3. Verify database connections
4. Ensure all dependencies installed
5. Check camera permissions

---

## ✅ Checklist

Before going live, ensure:

- [ ] Backend server running (port 3000)
- [ ] Frontend server running (port 3001)
- [ ] PostgreSQL database connected
- [ ] Face-API.js models downloaded
- [ ] Camera permissions granted
- [ ] Face database loaded (students + teachers)
- [ ] Test recognition working
- [ ] Unknown detection working
- [ ] Logs updating in real-time
- [ ] Exit marking functional

---

**Your Zone 1 Live Tracking system is ready! 🎉**
