"""
IntelliSight - Face Encoding Training Script
Author: IntelliSight Team
Description: Train face encodings from dataset images

Dataset Structure:
    dataset/
        student_1/
            image1.jpg
            image2.jpg
            ...
        student_2/
            image1.jpg
            ...
        teacher_1/
            image1.jpg
            ...

This script will:
1. Load all images from dataset/ folders
2. Detect faces in each image
3. Generate face encodings using face_recognition library
4. Save encodings to models/encodings.pickle
"""

import os
import cv2
import face_recognition
import pickle
from pathlib import Path
from typing import List, Dict
from utils import setup_logging, parse_person_id, save_encodings

logger = setup_logging()


def load_images_from_dataset(dataset_path: str = "dataset") -> Dict[str, List[str]]:
    """
    Load image paths from dataset folder structure
    
    Args:
        dataset_path: Path to dataset directory
        
    Returns:
        Dictionary mapping person labels to image paths
    """
    dataset_path = Path(dataset_path)
    
    if not dataset_path.exists():
        raise FileNotFoundError(f"Dataset directory not found: {dataset_path}")
    
    image_paths = {}
    supported_formats = {'.jpg', '.jpeg', '.png', '.bmp'}
    
    # Iterate through person folders
    for person_folder in dataset_path.iterdir():
        if not person_folder.is_dir():
            continue
        
        try:
            # Parse person type and ID from folder name
            person_type, person_id = parse_person_id(person_folder.name)
            label = f"{person_type}_{person_id}"
            
            # Find all image files
            person_images = []
            for img_file in person_folder.iterdir():
                if img_file.suffix.lower() in supported_formats:
                    person_images.append(str(img_file))
            
            if person_images:
                image_paths[label] = person_images
                logger.info(f"Found {len(person_images)} images for {label}")
            else:
                logger.warning(f"No images found in {person_folder}")
        
        except ValueError as e:
            logger.error(f"Skipping folder {person_folder.name}: {e}")
            continue
    
    return image_paths


def extract_face_encodings(image_path: str, method: str = "hog") -> List:
    """
    Extract face encodings from an image
    
    Args:
        image_path: Path to image file
        method: Detection method ('hog' or 'cnn')
        
    Returns:
        List of face encodings (128-dimensional vectors)
    """
    try:
        # Load image
        image = face_recognition.load_image_file(image_path)
        
        # Convert RGB to BGR for OpenCV compatibility
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Detect face locations
        face_locations = face_recognition.face_locations(rgb_image, model=method)
        
        if not face_locations:
            logger.warning(f"No faces detected in {image_path}")
            return []
        
        # Extract encodings
        encodings = face_recognition.face_encodings(rgb_image, face_locations)
        
        if len(face_locations) > 1:
            logger.warning(f"Multiple faces detected in {image_path}. Using first face.")
        
        return encodings
    
    except Exception as e:
        logger.error(f"Error processing {image_path}: {e}")
        return []


def train_encodings(dataset_path: str = "dataset", 
                   output_path: str = "models/encodings.pickle",
                   detection_method: str = "hog") -> Dict:
    """
    Train face encodings from dataset
    
    Args:
        dataset_path: Path to dataset directory
        output_path: Path to save encodings pickle
        detection_method: Face detection method ('hog' or 'cnn')
        
    Returns:
        Dictionary with encodings data
    """
    logger.info("Starting face encoding training...")
    logger.info(f"Dataset path: {dataset_path}")
    logger.info(f"Detection method: {detection_method}")
    
    # Load image paths
    image_paths = load_images_from_dataset(dataset_path)
    
    if not image_paths:
        raise ValueError("No valid images found in dataset. Please check dataset structure.")
    
    total_persons = len(image_paths)
    total_images = sum(len(imgs) for imgs in image_paths.values())
    logger.info(f"Found {total_images} images for {total_persons} persons")
    
    # Storage for encodings
    all_encodings = []
    all_names = []
    metadata = {
        'person_types': {},  # Maps label to person_type (STUDENT/TEACHER)
        'person_ids': {},    # Maps label to person_id (integer)
        'image_counts': {},  # Maps label to number of training images
        'detection_method': detection_method
    }
    
    # Process each person
    processed_count = 0
    for label, img_paths in image_paths.items():
        logger.info(f"\nProcessing {label} ({len(img_paths)} images)...")
        
        person_encodings = []
        person_type, person_id = parse_person_id(label.lower())
        
        # Process each image
        for idx, img_path in enumerate(img_paths, 1):
            logger.info(f"  [{idx}/{len(img_paths)}] {Path(img_path).name}")
            
            encodings = extract_face_encodings(img_path, method=detection_method)
            
            if encodings:
                # Take first encoding if multiple faces detected
                encoding = encodings[0]
                person_encodings.append(encoding)
                all_encodings.append(encoding)
                all_names.append(label)
                processed_count += 1
            else:
                logger.warning(f"  ⚠️  Skipping {img_path} - no face detected")
        
        # Store metadata
        metadata['person_types'][label] = person_type
        metadata['person_ids'][label] = person_id
        metadata['image_counts'][label] = len(person_encodings)
        
        logger.info(f"✅ {label}: {len(person_encodings)}/{len(img_paths)} images processed successfully")
    
    # Create encodings data structure
    encodings_data = {
        'encodings': all_encodings,
        'names': all_names,
        'metadata': metadata
    }
    
    # Save encodings
    save_encodings(encodings_data, output_path)
    
    logger.info(f"\n{'='*60}")
    logger.info(f"✅ Training Complete!")
    logger.info(f"{'='*60}")
    logger.info(f"Total persons: {total_persons}")
    logger.info(f"Total images processed: {processed_count}/{total_images}")
    logger.info(f"Total encodings: {len(all_encodings)}")
    logger.info(f"Encodings saved to: {output_path}")
    logger.info(f"{'='*60}\n")
    
    return encodings_data


def validate_encodings(encodings_path: str = "models/encodings.pickle"):
    """
    Validate saved encodings file
    
    Args:
        encodings_path: Path to encodings pickle file
    """
    logger.info("Validating encodings file...")
    
    if not os.path.exists(encodings_path):
        logger.error(f"Encodings file not found: {encodings_path}")
        return False
    
    try:
        with open(encodings_path, 'rb') as f:
            data = pickle.load(f)
        
        required_keys = ['encodings', 'names', 'metadata']
        for key in required_keys:
            if key not in data:
                logger.error(f"Missing key in encodings file: {key}")
                return False
        
        num_encodings = len(data['encodings'])
        num_names = len(data['names'])
        
        if num_encodings != num_names:
            logger.error(f"Mismatch: {num_encodings} encodings but {num_names} names")
            return False
        
        logger.info(f"✅ Encodings file is valid")
        logger.info(f"   Encodings: {num_encodings}")
        logger.info(f"   Persons: {len(set(data['names']))}")
        
        # Display metadata
        metadata = data.get('metadata', {})
        logger.info(f"\nMetadata:")
        logger.info(f"   Detection method: {metadata.get('detection_method', 'unknown')}")
        
        if 'image_counts' in metadata:
            logger.info(f"\n   Image counts per person:")
            for label, count in metadata['image_counts'].items():
                logger.info(f"      {label}: {count} images")
        
        return True
    
    except Exception as e:
        logger.error(f"Error validating encodings: {e}")
        return False


if __name__ == "__main__":
    import argparse
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Train face encodings from dataset")
    parser.add_argument('--dataset', type=str, default='dataset',
                       help='Path to dataset directory (default: dataset)')
    parser.add_argument('--output', type=str, default='models/encodings.pickle',
                       help='Path to save encodings (default: models/encodings.pickle)')
    parser.add_argument('--method', type=str, default='hog', choices=['hog', 'cnn'],
                       help='Face detection method: hog (faster) or cnn (more accurate)')
    parser.add_argument('--validate', action='store_true',
                       help='Validate encodings file after training')
    
    args = parser.parse_args()
    
    try:
        # Train encodings
        encodings_data = train_encodings(
            dataset_path=args.dataset,
            output_path=args.output,
            detection_method=args.method
        )
        
        # Validate if requested
        if args.validate:
            print()
            validate_encodings(args.output)
        
        print("\n✅ Training completed successfully!")
        print(f"You can now run live_recognition.py to start face recognition.")
    
    except Exception as e:
        logger.error(f"❌ Training failed: {e}")
        exit(1)
