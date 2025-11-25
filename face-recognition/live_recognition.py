"""
IntelliSight - Live Face Recognition System
Author: IntelliSight Team
Description: Real-time face detection and recognition with entry/exit tracking

This script:
1. Opens webcam feed
2. Detects faces using OpenCV (Haar Cascade or DNN)
3. Recognizes faces against trained encodings
4. Tracks entry/exit of persons
5. Sends data to backend API
6. Handles offline mode with local logging
"""

import cv2
import face_recognition
import numpy as np
import time
from datetime import datetime
from collections import defaultdict
from typing import Dict, Set, Tuple
from utils import (
    setup_logging,
    load_config,
    load_encodings,
    FaceDetector,
    FPSCounter,
    draw_face_box,
    draw_info_panel
)
from send_to_backend import BackendAPI

logger = setup_logging()


class PersonTracker:
    """Track person appearances and disappearances for entry/exit logic"""
    
    def __init__(self, disappear_threshold: float = 3.0):
        """
        Initialize person tracker
        
        Args:
            disappear_threshold: Seconds before considering person disappeared
        """
        self.disappear_threshold = disappear_threshold
        self.active_persons: Dict[str, float] = {}  # label -> last_seen_time
        self.entered_persons: Set[str] = set()  # Persons who have entered
        self.exited_persons: Set[str] = set()   # Persons who have exited
    
    def update(self, recognized_labels: Set[str]) -> Tuple[Set[str], Set[str]]:
        """
        Update tracker with recognized persons
        
        Args:
            recognized_labels: Set of person labels currently visible
            
        Returns:
            Tuple of (new_entries, new_exits)
        """
        current_time = time.time()
        new_entries = set()
        new_exits = set()
        
        # Update last seen time for recognized persons
        for label in recognized_labels:
            if label not in self.active_persons:
                # New person appeared
                if label not in self.entered_persons:
                    new_entries.add(label)
                    self.entered_persons.add(label)
                    logger.info(f"👋 NEW ENTRY: {label}")
            
            self.active_persons[label] = current_time
        
        # Check for disappeared persons
        disappeared = []
        for label, last_seen in list(self.active_persons.items()):
            if label not in recognized_labels:
                time_since_seen = current_time - last_seen
                
                if time_since_seen >= self.disappear_threshold:
                    # Person has disappeared
                    disappeared.append(label)
                    
                    if label in self.entered_persons and label not in self.exited_persons:
                        new_exits.add(label)
                        self.exited_persons.add(label)
                        logger.info(f"👋 NEW EXIT: {label}")
        
        # Remove disappeared persons
        for label in disappeared:
            del self.active_persons[label]
        
        return new_entries, new_exits
    
    def get_active_count(self) -> int:
        """Get number of currently active persons"""
        return len(self.active_persons)
    
    def reset(self):
        """Reset tracker state"""
        self.active_persons.clear()
        self.entered_persons.clear()
        self.exited_persons.clear()


class LiveRecognitionSystem:
    """Main live face recognition system"""
    
    def __init__(self, config: Dict = None):
        """
        Initialize recognition system
        
        Args:
            config: Configuration dictionary
        """
        self.config = config or load_config()
        
        # Load face encodings
        model_path = self.config.get('model_path', 'models/encodings.pickle')
        encodings_data = load_encodings(model_path)
        
        if not encodings_data:
            raise FileNotFoundError(
                f"Encodings not found at {model_path}. "
                f"Please run train_encodings.py first."
            )
        
        self.known_encodings = encodings_data['encodings']
        self.known_names = encodings_data['names']
        self.metadata = encodings_data.get('metadata', {})
        
        logger.info(f"Loaded {len(self.known_names)} face encodings")
        
        # Initialize face detector
        detection_method = self.config.get('detection_method', 'dnn')
        self.face_detector = FaceDetector(method=detection_method)
        
        # Initialize backend API
        self.backend_api = BackendAPI(self.config)
        self.backend_api.login()
        
        # Initialize person tracker
        disappear_threshold = self.config.get('disappear_threshold', 3.0)
        self.tracker = PersonTracker(disappear_threshold)
        
        # Recognition settings
        self.tolerance = self.config.get('recognition_tolerance', 0.6)
        self.process_every_n_frames = self.config.get('process_every_n_frames', 2)
        self.resize_scale = self.config.get('resize_scale', 0.25)
        
        # Camera settings
        self.camera_source = self.config.get('camera_source', 0)
        self.camera_width = self.config.get('camera_width', 640)
        self.camera_height = self.config.get('camera_height', 480)
        
        # Zone settings
        self.zone_id = self.config.get('default_zone_id', 1)
        
        # Frame counter and FPS
        self.frame_count = 0
        self.fps_counter = FPSCounter()
        
        logger.info("Live recognition system initialized")
    
    def recognize_faces(self, frame: np.ndarray) -> Dict[str, Tuple[int, int, int, int]]:
        """
        Recognize faces in frame
        
        Args:
            frame: Input BGR frame
            
        Returns:
            Dictionary mapping person labels to bounding boxes
        """
        # Detect faces
        face_locations = self.face_detector.detect(frame)
        
        if not face_locations:
            return {}
        
        # Resize for faster processing
        small_frame = cv2.resize(frame, (0, 0), fx=self.resize_scale, fy=self.resize_scale)
        rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)
        
        # Convert face locations to face_recognition format
        face_locations_rgb = []
        for (x, y, w, h) in face_locations:
            # Scale coordinates
            x_scaled = int(x * self.resize_scale)
            y_scaled = int(y * self.resize_scale)
            w_scaled = int(w * self.resize_scale)
            h_scaled = int(h * self.resize_scale)
            
            # Convert to (top, right, bottom, left) format
            top = y_scaled
            right = x_scaled + w_scaled
            bottom = y_scaled + h_scaled
            left = x_scaled
            
            face_locations_rgb.append((top, right, bottom, left))
        
        # Get face encodings
        face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations_rgb)
        
        # Match faces
        recognized = {}
        for i, face_encoding in enumerate(face_encodings):
            # Compare with known faces
            matches = face_recognition.compare_faces(
                self.known_encodings,
                face_encoding,
                tolerance=self.tolerance
            )
            
            name = "Unknown"
            
            # Use face with smallest distance
            if True in matches:
                face_distances = face_recognition.face_distance(
                    self.known_encodings,
                    face_encoding
                )
                best_match_index = np.argmin(face_distances)
                
                if matches[best_match_index]:
                    name = self.known_names[best_match_index]
            
            # Store recognition result
            recognized[name] = face_locations[i]
        
        return recognized
    
    def parse_label(self, label: str) -> Tuple[str, int]:
        """
        Parse person label to get type and ID
        
        Args:
            label: Label string (e.g., "STUDENT_5")
            
        Returns:
            Tuple of (person_type, person_id)
        """
        if label == "Unknown":
            return "UNKNOWN", 0
        
        parts = label.split('_')
        if len(parts) == 2:
            return parts[0], int(parts[1])
        
        return "UNKNOWN", 0
    
    def handle_entry(self, label: str):
        """
        Handle person entry event
        
        Args:
            label: Person label (e.g., "STUDENT_5")
        """
        if label == "Unknown":
            return
        
        person_type, person_id = self.parse_label(label)
        
        # Send to backend
        success, _ = self.backend_api.send_entry(
            person_type=person_type,
            person_id=person_id,
            zone_id=self.zone_id
        )
        
        if success:
            logger.info(f"✅ Entry logged: {label}")
        else:
            logger.warning(f"⚠️  Entry failed: {label}")
    
    def handle_exit(self, label: str):
        """
        Handle person exit event
        
        Args:
            label: Person label (e.g., "STUDENT_5")
        """
        if label == "Unknown":
            return
        
        person_type, person_id = self.parse_label(label)
        
        # Send to backend
        success, _ = self.backend_api.send_exit(
            person_type=person_type,
            person_id=person_id,
            zone_id=self.zone_id
        )
        
        if success:
            logger.info(f"✅ Exit logged: {label}")
        else:
            logger.warning(f"⚠️  Exit failed: {label}")
    
    def run(self):
        """Run live recognition system"""
        logger.info("Starting live recognition...")
        logger.info(f"Opening camera: {self.camera_source}")
        
        # Open camera
        video_capture = cv2.VideoCapture(self.camera_source)
        
        if not video_capture.isOpened():
            raise RuntimeError(f"Failed to open camera: {self.camera_source}")
        
        # Set camera resolution
        video_capture.set(cv2.CAP_PROP_FRAME_WIDTH, self.camera_width)
        video_capture.set(cv2.CAP_PROP_FRAME_HEIGHT, self.camera_height)
        
        logger.info("✅ Camera opened successfully")
        logger.info("Press 'q' to quit, 's' to sync offline entries")
        
        try:
            while True:
                # Read frame
                ret, frame = video_capture.read()
                
                if not ret:
                    logger.error("Failed to read frame from camera")
                    break
                
                self.frame_count += 1
                
                # Process every N frames
                recognized = {}
                if self.frame_count % self.process_every_n_frames == 0:
                    recognized = self.recognize_faces(frame)
                
                # Update tracker
                recognized_labels = set(recognized.keys()) - {"Unknown"}
                new_entries, new_exits = self.tracker.update(recognized_labels)
                
                # Handle entries and exits
                for label in new_entries:
                    self.handle_entry(label)
                
                for label in new_exits:
                    self.handle_exit(label)
                
                # Draw results
                for label, box in recognized.items():
                    color = (0, 255, 0) if label != "Unknown" else (0, 0, 255)
                    draw_face_box(frame, box, label, color)
                
                # Update FPS
                fps = self.fps_counter.update()
                
                # Draw info panel
                backend_status = "Connected" if self.backend_api.is_online else "Offline"
                draw_info_panel(
                    frame,
                    fps,
                    self.tracker.get_active_count(),
                    backend_status
                )
                
                # Display frame
                cv2.imshow('IntelliSight - Live Recognition', frame)
                
                # Handle keyboard input
                key = cv2.waitKey(1) & 0xFF
                
                if key == ord('q'):
                    logger.info("Quit requested")
                    break
                elif key == ord('s'):
                    logger.info("Syncing offline entries...")
                    successful, failed = self.backend_api.sync_offline_entries()
                    logger.info(f"Sync complete: {successful} synced, {failed} failed")
                elif key == ord('r'):
                    logger.info("Resetting tracker...")
                    self.tracker.reset()
                
                # Auto-sync offline entries
                self.backend_api.sync_offline_entries()
        
        finally:
            # Cleanup
            video_capture.release()
            cv2.destroyAllWindows()
            logger.info("Camera released, windows closed")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="IntelliSight Live Face Recognition")
    parser.add_argument('--camera', type=int, default=0,
                       help='Camera index (default: 0)')
    parser.add_argument('--zone', type=int, default=1,
                       help='Zone ID (default: 1)')
    parser.add_argument('--tolerance', type=float, default=0.6,
                       help='Recognition tolerance (default: 0.6, lower = stricter)')
    parser.add_argument('--method', type=str, default='dnn', choices=['haar', 'dnn'],
                       help='Face detection method (default: dnn)')
    
    args = parser.parse_args()
    
    try:
        # Load config
        config = load_config()
        
        # Override with command line arguments
        config['camera_source'] = args.camera
        config['default_zone_id'] = args.zone
        config['recognition_tolerance'] = args.tolerance
        config['detection_method'] = args.method
        
        # Initialize and run system
        system = LiveRecognitionSystem(config)
        system.run()
    
    except KeyboardInterrupt:
        logger.info("\n⚠️  Interrupted by user")
    except Exception as e:
        logger.error(f"❌ Error: {e}", exc_info=True)
    finally:
        logger.info("Shutting down...")
