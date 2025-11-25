# IntelliSight - Face Recognition System

Complete Python-based face detection and recognition system for the IntelliSight FYP project. This system integrates with the existing Node.js backend to provide real-time facial recognition for entry/exit tracking.

## 🚀 Features

- **Real-time Face Detection**: Uses OpenCV with both Haar Cascade and DNN methods
- **Face Recognition**: Powered by `face_recognition` library with dlib
- **Entry/Exit Tracking**: Automatically detects when persons enter and leave
- **Backend Integration**: Sends data to Node.js API with JWT authentication
- **Offline Mode**: Saves entries locally when backend is unavailable
- **Auto-sync**: Automatically syncs offline entries when connection restored
- **Multi-camera Support**: Can work with webcam, USB cameras, or RTSP streams
- **Performance Optimized**: Configurable frame processing and FPS optimization

## 📋 Requirements

- Python 3.8 or higher
- Windows 10/11, Ubuntu 20.04+, or Raspberry Pi OS
- Webcam or IP camera
- Node.js backend running (see main README)

## 🛠️ Installation

### Windows

1. **Install Python 3.8+**
   - Download from [python.org](https://www.python.org/downloads/)
   - Make sure to check "Add Python to PATH"

2. **Install CMake** (required for dlib)
   ```powershell
   # Using chocolatey
   choco install cmake

   # Or download from https://cmake.org/download/
   ```

3. **Install Visual Studio Build Tools**
   - Download from [visualstudio.microsoft.com](https://visualstudio.microsoft.com/downloads/)
   - Select "Desktop development with C++"

4. **Install Python dependencies**
   ```powershell
   cd face-recognition
   pip install -r requirements.txt
   ```

### Ubuntu/Linux

```bash
cd face-recognition

# Install system dependencies
sudo apt-get update
sudo apt-get install -y python3-pip cmake build-essential

# Install Python dependencies
pip3 install -r requirements.txt
```

### Raspberry Pi

```bash
cd face-recognition

# Install system dependencies
sudo apt-get update
sudo apt-get install -y python3-pip cmake build-essential
sudo apt-get install -y libatlas-base-dev libopenblas-dev

# Install Python dependencies (may take 30-60 minutes)
pip3 install -r requirements.txt
```

## 📁 Dataset Collection

### 1. Create Dataset Folders

The system expects a specific folder structure:

```
face-recognition/
└── dataset/
    ├── student_1/
    │   ├── image1.jpg
    │   ├── image2.jpg
    │   └── image3.jpg
    ├── student_2/
    │   └── ...
    ├── teacher_1/
    │   └── ...
    └── teacher_2/
        └── ...
```

**Naming Convention:**
- Student folders: `student_X` (where X is the student ID from database)
- Teacher folders: `teacher_X` (where X is the teacher ID from database)

### 2. Collect Training Images

**Best Practices:**
- **Number of images**: 5-10 images per person minimum
- **Lighting**: Well-lit, consistent lighting
- **Angles**: Include front-facing and slight angle variations
- **Distance**: Face should be clearly visible, not too far or close
- **Background**: Varied backgrounds are OK
- **Quality**: Good resolution (at least 640x480)

**Example using webcam:**

```python
# quick_capture.py - Simple script to capture training images
import cv2
import os

person_id = 1  # Change this
person_type = "student"  # or "teacher"
num_images = 10

folder = f"dataset/{person_type}_{person_id}"
os.makedirs(folder, exist_ok=True)

cap = cv2.VideoCapture(0)
count = 0

print(f"Press SPACE to capture image, ESC to finish")
print(f"Capturing {num_images} images for {person_type}_{person_id}...")

while count < num_images:
    ret, frame = cap.read()
    cv2.imshow('Capture', frame)
    
    key = cv2.waitKey(1) & 0xFF
    if key == 32:  # SPACE
        filename = f"{folder}/image{count+1}.jpg"
        cv2.imwrite(filename, frame)
        print(f"Saved: {filename}")
        count += 1
    elif key == 27:  # ESC
        break

cap.release()
cv2.destroyAllWindows()
print(f"✅ Captured {count} images")
```

## 🎯 Usage

### Step 1: Configure Settings

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:
```env
# Backend Configuration
BACKEND_URL=http://localhost:3000
API_BASE_URL=http://localhost:3000/api
ADMIN_EMAIL=john.admin@intellisight.com
ADMIN_PASSWORD=admin123

# Zone and Camera
DEFAULT_ZONE_ID=1
DEFAULT_CAMERA_ID=1

# Recognition Settings
RECOGNITION_TOLERANCE=0.6
DETECTION_METHOD=dnn
MODEL_PATH=models/encodings.pickle

# Camera Settings
CAMERA_SOURCE=0
CAMERA_WIDTH=640
CAMERA_HEIGHT=480

# Performance
PROCESS_EVERY_N_FRAMES=2
RESIZE_SCALE=0.25

# Entry/Exit Logic
DISAPPEAR_THRESHOLD=3.0

# Offline Mode
ENABLE_OFFLINE_MODE=true
OFFLINE_LOG_FILE=logs/offline_entries.json
SYNC_INTERVAL=30
```

### Step 2: Train Face Encodings

After collecting dataset images:

```bash
# Using default settings (HOG method - faster)
python train_encodings.py

# Using CNN method (slower but more accurate)
python train_encodings.py --method cnn

# Validate after training
python train_encodings.py --validate

# Custom paths
python train_encodings.py --dataset custom_dataset --output custom_model.pickle
```

**Expected Output:**
```
Starting face encoding training...
Dataset path: dataset
Detection method: hog
Found 45 images for 5 persons

Processing STUDENT_1 (10 images)...
  [1/10] image1.jpg
  [2/10] image2.jpg
  ...
✅ STUDENT_1: 10/10 images processed successfully

...

======================================================================
✅ Training Complete!
======================================================================
Total persons: 5
Total images processed: 42/45
Total encodings: 42
Encodings saved to: models/encodings.pickle
======================================================================
```

### Step 3: Start Backend Server

In a separate terminal, make sure the Node.js backend is running:

```bash
cd .. # Go to project root
npm start
```

### Step 4: Run Live Recognition

```bash
python live_recognition.py
```

**Command Line Options:**
```bash
# Use webcam 1 instead of 0
python live_recognition.py --camera 1

# Set zone ID to 2
python live_recognition.py --zone 2

# Use Haar Cascade (faster)
python live_recognition.py --method haar

# Stricter recognition (lower tolerance)
python live_recognition.py --tolerance 0.5
```

**Keyboard Controls:**
- `q` - Quit application
- `s` - Manually sync offline entries
- `r` - Reset tracker (clear all active persons)

## 🎥 Camera Configuration

### Webcam
```env
CAMERA_SOURCE=0  # Built-in webcam
CAMERA_SOURCE=1  # USB webcam
```

### IP Camera / RTSP Stream
```env
CAMERA_SOURCE=rtsp://username:password@192.168.1.100:554/stream
```

### Test Camera
```python
import cv2
cap = cv2.VideoCapture(0)  # Change index
print(f"Camera opened: {cap.isOpened()}")
cap.release()
```

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Live Recognition                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ OpenCV   │→ │   Face   │→ │  Person  │              │
│  │ Detector │  │ Matching │  │ Tracker  │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│        ↓              ↓              ↓                   │
│  ┌──────────────────────────────────────┐               │
│  │       Backend API Integration         │               │
│  │   ┌────────┐  ┌────────┐            │               │
│  │   │ Entry  │  │  Exit  │            │               │
│  │   │  API   │  │  API   │            │               │
│  │   └────────┘  └────────┘            │               │
│  │        ↓           ↓                 │               │
│  │   ┌─────────────────────┐           │               │
│  │   │  Offline Mode       │           │               │
│  │   │  (JSON Logging)     │           │               │
│  │   └─────────────────────┘           │               │
│  └──────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│              Node.js Backend API                         │
│  POST /api/timetable/entry                              │
│  POST /api/timetable/exit                               │
│                    ↓                                     │
│             PostgreSQL Database                          │
└─────────────────────────────────────────────────────────┘
```

## 🔧 Advanced Configuration

### Detection Methods

**Haar Cascade:**
- ✅ Faster (good for Raspberry Pi)
- ❌ Less accurate with difficult angles
- Use for: Real-time systems with limited resources

**DNN (Deep Neural Network):**
- ✅ More accurate
- ✅ Better with angles and lighting
- ❌ Slower
- Use for: Better accuracy, modern hardware

### Recognition Tolerance

```env
RECOGNITION_TOLERANCE=0.6  # Default
```

- **Lower (0.4-0.5)**: Stricter matching, fewer false positives
- **Default (0.6)**: Balanced
- **Higher (0.7-0.8)**: More lenient, may increase false positives

### Performance Tuning

```env
# Process every 2nd frame (faster)
PROCESS_EVERY_N_FRAMES=2

# Resize images to 25% for processing (faster)
RESIZE_SCALE=0.25

# Disappear threshold in seconds
DISAPPEAR_THRESHOLD=3.0
```

## 🐛 Troubleshooting

### Issue: "dlib not installing"

**Windows:**
```powershell
# Install CMake and Visual Studio Build Tools first
# Then try:
pip install dlib-19.24.2-cp39-cp39-win_amd64.whl

# Or install from source:
pip install dlib --verbose
```

**Linux/Raspberry Pi:**
```bash
sudo apt-get install cmake build-essential
pip3 install dlib
```

### Issue: "No faces detected in training images"

- Check image quality and lighting
- Ensure faces are clearly visible
- Try using `--method cnn` for better detection
- Verify image files are not corrupted

### Issue: "Camera not opening"

```python
# Test camera access
import cv2
for i in range(5):
    cap = cv2.VideoCapture(i)
    if cap.isOpened():
        print(f"Camera {i} is available")
        cap.release()
```

### Issue: "Backend connection failed"

1. Check backend is running: `http://localhost:3000/health`
2. Verify credentials in `.env`
3. Check offline mode is enabled
4. Review logs: `logs/system.log`

### Issue: "Poor recognition accuracy"

1. **Collect more training images** (10-15 per person)
2. **Improve lighting** - consistent, well-lit conditions
3. **Adjust tolerance** - lower for stricter matching
4. **Use DNN method** - `--method dnn`
5. **Check camera quality** - minimum 640x480 resolution

### Issue: "Slow FPS"

1. **Use Haar Cascade** - `DETECTION_METHOD=haar`
2. **Process fewer frames** - `PROCESS_EVERY_N_FRAMES=3`
3. **Reduce resolution** - `CAMERA_WIDTH=480, CAMERA_HEIGHT=360`
4. **Increase resize scale** - `RESIZE_SCALE=0.20`

## 📝 API Integration Details

### Entry Request
```json
POST /api/timetable/entry
Authorization: Bearer <jwt_token>

{
  "personType": "STUDENT",
  "personId": 5,
  "zoneId": 1,
  "cameraId": 1,
  "entryTime": "2024-01-15T10:30:00.000Z"
}
```

### Exit Request
```json
POST /api/timetable/exit
Authorization: Bearer <jwt_token>

{
  "personType": "STUDENT",
  "personId": 5,
  "zoneId": 1,
  "exitTime": "2024-01-15T12:30:00.000Z"
}
```

## 📂 Project Structure

```
face-recognition/
├── train_encodings.py      # Training script
├── live_recognition.py     # Main recognition system
├── send_to_backend.py      # Backend API integration
├── utils.py                # Utility functions
├── requirements.txt        # Python dependencies
├── .env.example           # Configuration template
├── README.md              # This file
├── dataset/               # Training images
│   ├── student_1/
│   └── teacher_1/
├── models/                # Trained models
│   └── encodings.pickle
└── logs/                  # Log files
    ├── system.log
    └── offline_entries.json
```

## 🎓 Example Workflow

1. **Collect Data**
   ```bash
   # Create folders for 5 students
   mkdir -p dataset/student_{1..5}
   
   # Capture images (manually or using webcam script)
   ```

2. **Train Model**
   ```bash
   python train_encodings.py --validate
   ```

3. **Start Backend**
   ```bash
   cd ..
   npm start
   ```

4. **Run Recognition**
   ```bash
   python live_recognition.py
   ```

5. **Monitor**
   - Watch console logs for entries/exits
   - Check backend: `http://localhost:3000/api/timetable/active`
   - Review offline entries: `logs/offline_entries.json`

## 📊 Testing Backend Integration

```bash
# Test backend connection and API
python send_to_backend.py
```

**Expected Output:**
```
Testing Backend API Integration...

1. Testing connection to http://localhost:3000...
✅ Backend is online

2. Testing login with john.admin@intellisight.com...
✅ Login successful. Token: eyJhbGciOiJIUzI1NiI...

3. Testing entry record (TEST - student #999)...
✅ Entry sent successfully

4. Testing exit record (TEST - student #999)...
✅ Exit sent successfully

5. Checking status...
   Online: True
   Authenticated: True
   Offline entries: 0

✅ All tests completed!
```

## 🚀 Production Deployment

### Running as Service (Linux)

Create `/etc/systemd/system/intellisight-recognition.service`:

```ini
[Unit]
Description=IntelliSight Face Recognition
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/IntelliSight/face-recognition
Environment="DISPLAY=:0"
ExecStart=/usr/bin/python3 live_recognition.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable intellisight-recognition
sudo systemctl start intellisight-recognition
sudo systemctl status intellisight-recognition
```

## 📄 License

Part of the IntelliSight FYP project.

## 🤝 Support

For issues or questions:
1. Check troubleshooting section above
2. Review logs: `logs/system.log`
3. Verify backend is running
4. Check dataset structure and image quality

---

**IntelliSight** - Intelligent Access Control System with Facial Recognition

