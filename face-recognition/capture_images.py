"""
IntelliSight - Quick Image Capture Tool
Author: IntelliSight Team
Description: Simple tool to capture training images from webcam

Usage:
    python capture_images.py --person student_1 --count 10
    python capture_images.py --person teacher_5 --count 15
"""

import cv2
import os
import argparse
from pathlib import Path


def capture_images(person_label: str, num_images: int = 10, camera_index: int = 0):
    """
    Capture training images from webcam
    
    Args:
        person_label: Person label (e.g., "student_1", "teacher_3")
        num_images: Number of images to capture
        camera_index: Camera device index
    """
    # Create dataset folder
    dataset_folder = Path(f"dataset/{person_label}")
    dataset_folder.mkdir(parents=True, exist_ok=True)
    
    # Check existing images
    existing_images = list(dataset_folder.glob("*.jpg"))
    start_index = len(existing_images) + 1
    
    print(f"\n{'='*60}")
    print(f"IntelliSight - Image Capture Tool")
    print(f"{'='*60}")
    print(f"Person: {person_label}")
    print(f"Target: {num_images} images")
    print(f"Existing: {len(existing_images)} images")
    print(f"Save to: {dataset_folder}")
    print(f"{'='*60}\n")
    
    # Open camera
    cap = cv2.VideoCapture(camera_index)
    
    if not cap.isOpened():
        print(f"❌ Failed to open camera {camera_index}")
        return
    
    # Set resolution
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    
    print("Controls:")
    print("  SPACE - Capture image")
    print("  ESC   - Finish and exit")
    print(f"\nCapturing images {start_index} to {start_index + num_images - 1}...")
    print()
    
    count = 0
    captured_count = start_index - 1
    
    # Load face detector for preview
    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    )
    
    while count < num_images:
        ret, frame = cap.read()
        
        if not ret:
            print("❌ Failed to read frame")
            break
        
        # Detect faces for preview
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(30, 30))
        
        # Draw rectangles around faces
        display_frame = frame.copy()
        for (x, y, w, h) in faces:
            cv2.rectangle(display_frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
        
        # Show status
        status_text = f"Captured: {count}/{num_images}"
        if len(faces) > 0:
            status_text += f" | Faces: {len(faces)} ✓"
            status_color = (0, 255, 0)
        else:
            status_text += " | No face detected"
            status_color = (0, 0, 255)
        
        cv2.putText(display_frame, status_text, (10, 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, status_color, 2)
        
        cv2.putText(display_frame, "SPACE=Capture | ESC=Exit", (10, 60),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        # Display
        cv2.imshow(f'Capture Images - {person_label}', display_frame)
        
        # Handle keyboard
        key = cv2.waitKey(1) & 0xFF
        
        if key == 32:  # SPACE
            if len(faces) == 0:
                print("⚠️  No face detected - capture anyway? Press SPACE again to confirm")
                # Wait for confirmation
                key2 = cv2.waitKey(2000) & 0xFF
                if key2 != 32:
                    continue
            
            captured_count += 1
            filename = dataset_folder / f"image{captured_count}.jpg"
            cv2.imwrite(str(filename), frame)
            print(f"✅ Saved: {filename.name} ({count+1}/{num_images})")
            count += 1
            
        elif key == 27:  # ESC
            print(f"\n⚠️  Capture stopped by user")
            break
    
    # Cleanup
    cap.release()
    cv2.destroyAllWindows()
    
    print(f"\n{'='*60}")
    print(f"✅ Capture Complete!")
    print(f"{'='*60}")
    print(f"Total images captured: {count}")
    print(f"Total images in folder: {len(list(dataset_folder.glob('*.jpg')))}")
    print(f"Saved to: {dataset_folder}")
    print(f"{'='*60}\n")
    
    if count >= 5:
        print("✅ Ready for training! Run: python train_encodings.py")
    else:
        print("⚠️  Recommended: Capture at least 5-10 images per person")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Capture training images from webcam")
    parser.add_argument('--person', type=str, required=True,
                       help='Person label (e.g., student_1, teacher_3)')
    parser.add_argument('--count', type=int, default=10,
                       help='Number of images to capture (default: 10)')
    parser.add_argument('--camera', type=int, default=0,
                       help='Camera index (default: 0)')
    
    args = parser.parse_args()
    
    # Validate person label format
    parts = args.person.lower().split('_')
    if len(parts) != 2:
        print("❌ Invalid person label format")
        print("   Use: student_X or teacher_X (e.g., student_1, teacher_3)")
        exit(1)
    
    if parts[0] not in ['student', 'teacher']:
        print("❌ Invalid person type")
        print("   Use: student or teacher")
        exit(1)
    
    try:
        person_id = int(parts[1])
    except ValueError:
        print("❌ Invalid person ID - must be a number")
        exit(1)
    
    try:
        capture_images(args.person.lower(), args.count, args.camera)
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
