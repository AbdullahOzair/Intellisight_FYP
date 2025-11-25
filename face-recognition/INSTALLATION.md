# Installation Guide - IntelliSight Face Recognition

## ✅ Installation Complete!

All Python dependencies have been successfully installed in a virtual environment.

---

## 🔧 Installed Packages

- ✅ **opencv-python** (4.12.0.88) - Computer vision
- ✅ **opencv-contrib-python** (4.12.0.88) - Extended OpenCV modules
- ✅ **dlib** (20.0.0) - Face detection and recognition
- ✅ **face_recognition** (1.3.0) - Face recognition library
- ✅ **numpy** (2.2.6) - Numerical computing
- ✅ **Pillow** (12.0.0) - Image processing
- ✅ **requests** (2.32.5) - HTTP client
- ✅ **python-dotenv** (1.2.1) - Configuration management
- ✅ **scikit-learn** (1.7.2) - Machine learning utilities
- ✅ **imutils** (0.5.4) - Image processing utilities
- ✅ **cmake** (4.1.2) - Build tool for dlib

---

## 🚀 Quick Start

### 1. Activate Virtual Environment (Always do this first!)

```powershell
cd face-recognition
.\venv\Scripts\Activate.ps1
```

You should see `(venv)` in your terminal prompt.

### 2. Verify Installation

```powershell
python -c "import cv2, face_recognition, numpy; print('All packages loaded successfully!')"
```

### 3. Start Using the System

```powershell
# Collect training images
python capture_images.py --person student_1 --count 10

# Train the model
python train_encodings.py --validate

# Start zone tracking
python live_zone_tracking.py --zone 1
```

---

## 📝 Important Notes

### Always Activate Virtual Environment

Before running any Python script, ALWAYS activate the virtual environment:

```powershell
.\venv\Scripts\Activate.ps1
```

### Deactivate When Done

To exit the virtual environment:

```powershell
deactivate
```

### VS Code Python Interpreter

If using VS Code:

1. Press `Ctrl+Shift+P`
2. Type "Python: Select Interpreter"
3. Choose: `.\venv\Scripts\python.exe`

---

## 🔍 Troubleshooting

### "Could not find platform independent libraries"

This warning is harmless and can be ignored. It's a known issue with Python 3.13 on Windows and doesn't affect functionality.

### "Import errors" in VS Code

Make sure VS Code is using the virtual environment:
- Open Command Palette (`Ctrl+Shift+P`)
- Select "Python: Select Interpreter"
- Choose the venv interpreter

### Camera not working

Check that no other application is using the camera.

### Slow performance

- Use `--method haar` for faster detection
- Reduce `CAMERA_WIDTH` and `CAMERA_HEIGHT` in `.env`
- Increase `PROCESS_EVERY_N_FRAMES` in `.env`

---

## 📦 Package Management

### Install Additional Packages

```powershell
.\venv\Scripts\Activate.ps1
pip install package-name
```

### Update Packages

```powershell
.\venv\Scripts\Activate.ps1
pip install --upgrade package-name
```

### List Installed Packages

```powershell
.\venv\Scripts\Activate.ps1
pip list
```

---

## 🎯 Next Steps

1. ✅ Virtual environment created and activated
2. ✅ All dependencies installed
3. ⏭️ Configure `.env` file (already done - see `.env`)
4. ⏭️ Collect training images
5. ⏭️ Train face recognition model
6. ⏭️ Start zone tracking system

See **QUICK_REFERENCE.md** for command reference.
