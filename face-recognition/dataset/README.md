# Dataset Folder Structure

This directory contains training images for face recognition.

## Folder Naming Convention

Each folder should be named according to the person type and ID from the database:

- **Students**: `student_X` (where X is the student ID)
- **Teachers**: `teacher_X` (where X is the teacher ID)

## Example Structure

```
dataset/
├── student_1/
│   ├── image1.jpg
│   ├── image2.jpg
│   ├── image3.jpg
│   └── ...
├── student_2/
│   └── ...
├── teacher_1/
│   └── ...
└── teacher_2/
    └── ...
```

## Image Guidelines

### Quality Requirements
- **Format**: JPG, JPEG, PNG, or BMP
- **Resolution**: Minimum 640x480 recommended
- **File size**: No strict limit, but keep under 5MB per image
- **Lighting**: Well-lit, clear visibility of face

### Quantity Requirements
- **Minimum**: 5 images per person
- **Recommended**: 10-15 images per person
- **Maximum**: No limit, but 20+ may slow training

### Best Practices
1. **Variety**: Include different angles (front, slight left, slight right)
2. **Expressions**: Neutral and smiling expressions
3. **Lighting**: Different lighting conditions
4. **Background**: Varied backgrounds are OK
5. **Distance**: Face should fill 30-50% of frame
6. **Quality**: Clear, not blurry

### What to Avoid
- ❌ Blurry images
- ❌ Multiple people in one image
- ❌ Sunglasses or face coverings
- ❌ Extreme angles (looking away)
- ❌ Very dark or overexposed images

## Using the Capture Tool

### Quick Start
```bash
# Capture 10 images for student with ID 1
python capture_images.py --person student_1 --count 10

# Capture 15 images for teacher with ID 3
python capture_images.py --person teacher_3 --count 15
```

### Manual Collection
You can also manually add images:
1. Create folder: `dataset/student_X/` or `dataset/teacher_X/`
2. Add images with any filename (e.g., `photo1.jpg`, `pic001.jpg`)
3. System will automatically process all supported image files

## Training the Model

After collecting images:
```bash
# Train with default settings
python train_encodings.py

# Train and validate
python train_encodings.py --validate

# Use CNN for better accuracy (slower)
python train_encodings.py --method cnn
```

## Verification

Check your dataset before training:
```bash
# Windows PowerShell
Get-ChildItem -Recurse -Include *.jpg,*.jpeg,*.png | Group-Object Directory | Select-Object Count,Name

# Linux/Mac
find dataset -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) | wc -l
```

Expected output should show image counts per folder.

## Database IDs

Make sure the person IDs in folder names match your database:

### Get Student IDs
```sql
SELECT StudentID, FirstName, LastName FROM Students;
```

### Get Teacher IDs
```sql
SELECT TeacherID, FirstName, LastName FROM Teacher;
```

Or use the backend API:
```bash
# Login first to get token
$login = Invoke-RestMethod -Uri http://localhost:3000/api/auth/login -Method Post -Body '{"email":"john.admin@intellisight.com","password":"admin123"}' -ContentType 'application/json'
$token = $login.data.token

# Get students (replace with actual endpoint when available)
Invoke-RestMethod -Uri http://localhost:3000/api/students -Headers @{Authorization="Bearer $token"}
```

## Troubleshooting

### No faces detected during training
- Check image quality and lighting
- Ensure faces are clearly visible
- Try using `--method cnn` for better detection

### Wrong person recognized
- Collect more training images (10-15 per person)
- Ensure images are in correct folder
- Verify folder naming matches database IDs
- Adjust recognition tolerance in `.env`

## Example Dataset

The system includes example folders:
- `student_1/` - Ready for your images
- `student_2/` - Ready for your images
- `teacher_1/` - Ready for your images

Add 5-10 images to each folder, then run training.
