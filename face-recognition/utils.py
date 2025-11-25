"""
IntelliSight - Utility Functions
Author: IntelliSight Team
Description: Helper functions for face detection, logging, and configuration
"""

import os
import cv2
import json
import logging
import pickle
import numpy as np
from datetime import datetime
from typing import Dict, List, Tuple, Optional
from pathlib import Path

# Configure logging
def setup_logging(log_file: str = "logs/system.log", level: str = "INFO"):
    """Setup logging configuration"""
    os.makedirs(os.path.dirname(log_file), exist_ok=True)
    
    logging.basicConfig(
        level=getattr(logging, level.upper()),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler()
        ]
    )
    return logging.getLogger(__name__)

logger = setup_logging()

# Face Detection Methods
class FaceDetector:
    """
    Face Detection using multiple methods:
    1. Haar Cascade - Fast but less accurate
    2. DNN (Deep Neural Network) - Slower but more accurate
    """
    
    def __init__(self, method: str = "dnn"):
        """
        Initialize face detector
        
        Args:
            method: Detection method ('haar' or 'dnn')
        """
        self.method = method.lower()
        
        if self.method == "haar":
            self._init_haar()
        elif self.method == "dnn":
            self._init_dnn()
        else:
            raise ValueError(f"Unknown detection method: {method}")
        
        logger.info(f"Face detector initialized with method: {self.method}")
    
    def _init_haar(self):
        """Initialize Haar Cascade detector"""
        # Load Haar Cascade classifier
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        self.face_cascade = cv2.CascadeClassifier(cascade_path)
        
        if self.face_cascade.empty():
            raise RuntimeError("Failed to load Haar Cascade classifier")
        
        logger.info("Haar Cascade classifier loaded successfully")
    
    def _init_dnn(self):
        """Initialize DNN detector (Caffe model)"""
        # Download models if not exist
        model_dir = Path("models")
        model_dir.mkdir(exist_ok=True)
        
        prototxt_path = model_dir / "deploy.prototxt"
        model_path = model_dir / "res10_300x300_ssd_iter_140000.caffemodel"
        
        # Check if models exist
        if not prototxt_path.exists() or not model_path.exists():
            logger.warning("DNN models not found. Please download them:")
            logger.warning("1. deploy.prototxt")
            logger.warning("2. res10_300x300_ssd_iter_140000.caffemodel")
            logger.warning("Place them in the 'models' directory")
            logger.info("Attempting to use Haar Cascade as fallback...")
            self.method = "haar"
            self._init_haar()
            return
        
        # Load DNN model
        self.net = cv2.dnn.readNetFromCaffe(
            str(prototxt_path),
            str(model_path)
        )
        logger.info("DNN model loaded successfully")
    
    def detect_faces_haar(self, frame: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """
        Detect faces using Haar Cascade
        
        Args:
            frame: Input image (BGR)
            
        Returns:
            List of face bounding boxes (x, y, w, h)
        """
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30),
            flags=cv2.CASCADE_SCALE_IMAGE
        )
        return faces.tolist() if len(faces) > 0 else []
    
    def detect_faces_dnn(self, frame: np.ndarray, confidence_threshold: float = 0.5) -> List[Tuple[int, int, int, int]]:
        """
        Detect faces using DNN
        
        Args:
            frame: Input image (BGR)
            confidence_threshold: Minimum confidence for detection
            
        Returns:
            List of face bounding boxes (x, y, w, h)
        """
        (h, w) = frame.shape[:2]
        
        # Prepare blob from image
        blob = cv2.dnn.blobFromImage(
            cv2.resize(frame, (300, 300)),
            1.0,
            (300, 300),
            (104.0, 177.0, 123.0)
        )
        
        # Pass through network
        self.net.setInput(blob)
        detections = self.net.forward()
        
        faces = []
        for i in range(detections.shape[2]):
            confidence = detections[0, 0, i, 2]
            
            if confidence > confidence_threshold:
                box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
                (x1, y1, x2, y2) = box.astype("int")
                
                # Convert to (x, y, w, h) format
                x = max(0, x1)
                y = max(0, y1)
                width = min(w - x, x2 - x1)
                height = min(h - y, y2 - y1)
                
                if width > 0 and height > 0:
                    faces.append((x, y, width, height))
        
        return faces
    
    def detect(self, frame: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """
        Detect faces using selected method
        
        Args:
            frame: Input image (BGR)
            
        Returns:
            List of face bounding boxes (x, y, w, h)
        """
        if self.method == "haar":
            return self.detect_faces_haar(frame)
        else:
            return self.detect_faces_dnn(frame)


# Configuration Loader
def load_config(env_file: str = ".env") -> Dict:
    """
    Load configuration from .env file
    
    Args:
        env_file: Path to .env file
        
    Returns:
        Configuration dictionary
    """
    config = {
        # Backend
        'backend_url': 'http://localhost:3000',
        'api_base_url': 'http://localhost:3000/api',
        'admin_email': 'john.admin@intellisight.com',
        'admin_password': 'admin123',
        
        # Zone
        'default_zone_id': 1,
        'default_camera_id': 1,
        
        # Recognition
        'recognition_tolerance': 0.6,
        'detection_method': 'dnn',
        'model_path': 'models/encodings.pickle',
        
        # Camera
        'camera_source': 0,
        'camera_width': 640,
        'camera_height': 480,
        'camera_fps': 30,
        
        # Performance
        'process_every_n_frames': 2,
        'resize_scale': 0.25,
        
        # Entry/Exit
        'disappear_threshold': 3.0,
        'recognition_confidence': 0.6,
        
        # Offline
        'enable_offline_mode': True,
        'offline_log_file': 'logs/offline_entries.json',
        'sync_interval': 30,
        
        # Logging
        'log_level': 'INFO',
        'log_file': 'logs/system.log'
    }
    
    # Load from .env if exists
    if os.path.exists(env_file):
        try:
            from dotenv import load_dotenv
            load_dotenv(env_file)
            
            # Override with environment variables
            for key in config.keys():
                env_key = key.upper()
                env_value = os.getenv(env_key)
                if env_value is not None:
                    # Type conversion
                    if isinstance(config[key], bool):
                        config[key] = env_value.lower() in ('true', '1', 'yes')
                    elif isinstance(config[key], int):
                        config[key] = int(env_value)
                    elif isinstance(config[key], float):
                        config[key] = float(env_value)
                    else:
                        config[key] = env_value
        except ImportError:
            logger.warning("python-dotenv not installed. Using default configuration.")
    
    return config


# Save and Load Encodings
def save_encodings(encodings_data: Dict, filepath: str = "models/encodings.pickle"):
    """
    Save face encodings to pickle file
    
    Args:
        encodings_data: Dictionary with 'encodings', 'names', 'metadata'
        filepath: Output file path
    """
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    with open(filepath, 'wb') as f:
        pickle.dump(encodings_data, f)
    
    logger.info(f"Encodings saved to {filepath}")


def load_encodings(filepath: str = "models/encodings.pickle") -> Optional[Dict]:
    """
    Load face encodings from pickle file
    
    Args:
        filepath: Pickle file path
        
    Returns:
        Dictionary with encodings data or None if file doesn't exist
    """
    if not os.path.exists(filepath):
        logger.warning(f"Encodings file not found: {filepath}")
        return None
    
    with open(filepath, 'rb') as f:
        data = pickle.load(f)
    
    logger.info(f"Loaded {len(data.get('names', []))} encodings from {filepath}")
    return data


# Offline Log Management
def save_offline_entry(entry_data: Dict, log_file: str = "logs/offline_entries.json"):
    """
    Save entry to offline log file
    
    Args:
        entry_data: Entry data dictionary
        log_file: Path to offline log file
    """
    os.makedirs(os.path.dirname(log_file), exist_ok=True)
    
    # Load existing entries
    entries = []
    if os.path.exists(log_file):
        try:
            with open(log_file, 'r') as f:
                entries = json.load(f)
        except json.JSONDecodeError:
            entries = []
    
    # Add timestamp if not present
    if 'timestamp' not in entry_data:
        entry_data['timestamp'] = datetime.now().isoformat()
    
    # Append new entry
    entries.append(entry_data)
    
    # Save back
    with open(log_file, 'w') as f:
        json.dump(entries, f, indent=2)
    
    logger.info(f"Saved offline entry for person {entry_data.get('personId')}")


def load_offline_entries(log_file: str = "logs/offline_entries.json") -> List[Dict]:
    """
    Load offline entries
    
    Args:
        log_file: Path to offline log file
        
    Returns:
        List of entry dictionaries
    """
    if not os.path.exists(log_file):
        return []
    
    try:
        with open(log_file, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError:
        logger.error(f"Failed to parse offline log: {log_file}")
        return []


def clear_offline_entries(log_file: str = "logs/offline_entries.json"):
    """Clear offline entries log file"""
    if os.path.exists(log_file):
        os.remove(log_file)
        logger.info("Offline entries cleared")


# FPS Counter
class FPSCounter:
    """Simple FPS counter for performance monitoring"""
    
    def __init__(self):
        self.start_time = datetime.now()
        self.frame_count = 0
        self.fps = 0
    
    def update(self):
        """Update frame count and calculate FPS"""
        self.frame_count += 1
        elapsed = (datetime.now() - self.start_time).total_seconds()
        
        if elapsed > 1.0:
            self.fps = self.frame_count / elapsed
            self.frame_count = 0
            self.start_time = datetime.now()
        
        return self.fps
    
    def get_fps(self) -> float:
        """Get current FPS"""
        return self.fps


# Drawing Utilities
def draw_face_box(frame: np.ndarray, box: Tuple[int, int, int, int], 
                  name: str = "Unknown", color: Tuple[int, int, int] = (0, 255, 0),
                  thickness: int = 2):
    """
    Draw bounding box and name on frame
    
    Args:
        frame: Input image
        box: Bounding box (x, y, w, h)
        name: Person name
        color: Box color (BGR)
        thickness: Line thickness
    """
    x, y, w, h = box
    
    # Draw rectangle
    cv2.rectangle(frame, (x, y), (x + w, y + h), color, thickness)
    
    # Draw name background
    text_size = cv2.getTextSize(name, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
    cv2.rectangle(frame, (x, y - text_size[1] - 10), 
                 (x + text_size[0], y), color, -1)
    
    # Draw name text
    cv2.putText(frame, name, (x, y - 5), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)


def draw_info_panel(frame: np.ndarray, fps: float, active_count: int, 
                    backend_status: str = "Connected"):
    """
    Draw information panel on frame
    
    Args:
        frame: Input image
        fps: Current FPS
        active_count: Number of active persons
        backend_status: Backend connection status
    """
    height, width = frame.shape[:2]
    
    # Draw semi-transparent panel
    overlay = frame.copy()
    cv2.rectangle(overlay, (10, 10), (300, 100), (0, 0, 0), -1)
    cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)
    
    # Draw text
    cv2.putText(frame, f"FPS: {fps:.1f}", (20, 35), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
    cv2.putText(frame, f"Active: {active_count}", (20, 60), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
    
    # Backend status color
    status_color = (0, 255, 0) if backend_status == "Connected" else (0, 0, 255)
    cv2.putText(frame, f"Backend: {backend_status}", (20, 85), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, status_color, 2)


# Parse dataset folder structure
def parse_person_id(folder_name: str) -> Tuple[str, int]:
    """
    Parse person type and ID from folder name
    
    Supported formats:
    - student_5 -> ("STUDENT", 5)
    - teacher_3 -> ("TEACHER", 3)
    - STUDENT_10 -> ("STUDENT", 10)
    
    Args:
        folder_name: Folder name
        
    Returns:
        Tuple of (person_type, person_id)
    """
    parts = folder_name.lower().split('_')
    
    if len(parts) != 2:
        raise ValueError(f"Invalid folder name: {folder_name}. Use format: student_5 or teacher_3")
    
    person_type = parts[0].upper()
    try:
        person_id = int(parts[1])
    except ValueError:
        raise ValueError(f"Invalid person ID in folder name: {folder_name}")
    
    if person_type not in ["STUDENT", "TEACHER"]:
        raise ValueError(f"Invalid person type: {person_type}. Use STUDENT or TEACHER")
    
    return person_type, person_id


if __name__ == "__main__":
    # Test utilities
    print("Testing IntelliSight Utilities...")
    
    # Test face detector
    detector = FaceDetector(method="haar")
    print(f"✅ Face detector initialized: {detector.method}")
    
    # Test configuration
    config = load_config()
    print(f"✅ Configuration loaded: {len(config)} settings")
    
    # Test person ID parsing
    person_type, person_id = parse_person_id("student_5")
    print(f"✅ Parsed: {person_type} #{person_id}")
    
    print("\n✅ All utility tests passed!")
