# IntelliSight - Quick Reference Card

## 🚀 Installation (One-Time)

```powershell
cd face-recognition
pip install -r requirements.txt
copy .env.example .env
```

---

## 📸 Collect Training Images

```powershell
python capture_images.py --person student_1 --count 10
python capture_images.py --person student_2 --count 10
python capture_images.py --person teacher_1 --count 10
```

**During capture:** SPACE = capture, ESC = finish

---

## 🎓 Train Model

```powershell
python train_encodings.py --validate
```

---

## 🎯 Run Zone Tracking (Main System)

```powershell
# Start backend first
cd ..
npm run dev

# Start zone tracking
cd face-recognition
python live_zone_tracking.py --zone 1
```

**Keyboard:** `q` = quit, `s` = sync, `r` = reset

---

## 📊 Common Commands

### Change Zone
```powershell
python live_zone_tracking.py --zone 2
```

### Different Camera
```powershell
python live_zone_tracking.py --camera 1 --zone 1
```

### Faster Detection (Haar)
```powershell
python live_zone_tracking.py --method haar --zone 1
```

### Change Update Interval
```powershell
python live_zone_tracking.py --zone 1 --update-interval 30.0
```

### Multi-Zone Setup
```powershell
# Terminal 1
python live_zone_tracking.py --camera 0 --zone 1

# Terminal 2
python live_zone_tracking.py --camera 1 --zone 2
```

---

## 🔧 Configuration (.env)

```env
DEFAULT_ZONE_ID=1              # Zone this camera monitors
ZONE_UPDATE_INTERVAL=60.0      # Update every 60 seconds
CAMERA_SOURCE=0                # Camera index or RTSP
RECOGNITION_TOLERANCE=0.6      # Lower = stricter
DETECTION_METHOD=dnn           # haar or dnn
```

---

## 📡 API Endpoint

```
POST /api/timetable/zone

{
  "personType": "STUDENT",
  "personId": 5,
  "zoneId": 2,
  "timestamp": "2025-01-01T12:01:00"
}
```

---

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| dlib install fails | Install CMake and VS Build Tools |
| No faces detected | Check lighting, use `--method cnn` |
| Camera not found | Try `--camera 1` or `--camera 2` |
| Backend offline | Check `npm run dev`, offline mode will cache |
| Unknown person | Collect more images, retrain model |
| Slow FPS | Use `--method haar`, edit `.env` |

---

## 📚 Documentation

- **COMPLETE_IMPLEMENTATION.md** - Full implementation details
- **ZONE_TRACKING.md** - Zone tracking guide
- **COMPARISON.md** - Zone vs Entry/Exit comparison
- **README.md** - Complete documentation
- **QUICKSTART.md** - 5-minute setup

---

## ✅ Quick Test

```powershell
# 1. Backend running?
curl http://localhost:3000/health

# 2. Login
$body = '{"email":"john.admin@intellisight.com","password":"admin123"}'
$login = Invoke-RestMethod -Uri http://localhost:3000/api/auth/login -Method Post -Body $body -ContentType 'application/json'
$token = $login.data.token

# 3. Check zones
$headers = @{Authorization="Bearer $token"}
Invoke-RestMethod -Uri http://localhost:3000/api/zones -Headers $headers
```

---

## 🎯 Key Files

- **`live_zone_tracking.py`** - Main zone tracking system
- **`train_encodings.py`** - Train face recognition
- **`capture_images.py`** - Collect training images
- **`send_zone_to_backend.py`** - Backend API integration

---

## 📞 Support

Logs: `face-recognition/logs/system.log`
Offline cache: `face-recognition/logs/offline_zones.json`

---

**IntelliSight Zone Tracking System** 📍
