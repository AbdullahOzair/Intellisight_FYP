"""
IntelliSight - Live Zone Tracking System
Author: IntelliSight Team
Description: Real-time face detection and zone-based tracking

This script:
1. Opens webcam feed
2. Detects faces using OpenCV (Haar Cascade or DNN)
3. Recognizes faces against trained encodings
4. Tracks which zone each person is in
5. Sends zone updates to backend API
6. Handles offline mode with local logging

ZONE TRACKING ONLY - No attendance/entry-exit logging
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
from send_zone_to_backend import ZoneTrackingAPI

logger = setup_logging()


class ZoneTracker:
    """Track which zone each person is currently in"""
    
    def __init__(self, zone_id: int, update_interval: float = 60.0):
        """
        Initialize zone tracker
        
        Args:
            zone_id: Current zone ID
            update_interval: Seconds between zone updates for same person
        """
        self.zone_id = zone_id
        self.update_interval = update_interval
        
        # Track last update time for each person
        self.person_zones: Dict[str, int] = {}  # label -> zone_id
        self.last_update: Dict[str, float] = {}  # label -> timestamp
        self.active_persons: Dict[str, float] = {}  # label -> last_seen
    
    def update(self, recognized_labels: Set[str]) -> Set[str]:
        """
        Update tracker with currently visible persons
        
        Args:
            recognized_labels: Set of person labels currently visible
            
        Returns:
            Set of labels that need zone updates
        """
        current_time = time.time()
        need_updates = set()
        
        # Check each recognized person
        for label in recognized_labels:
            if label == "Unknown":
                continue
            
            # Update last seen time
            self.active_persons[label] = current_time
            
            # Check if we need to send zone update
            last_zone = self.person_zones.get(label)
            last_time = self.last_update.get(label, 0)
            
            # Send update if:
            # 1. First time seeing this person, OR
            # 2. Person changed zones, OR
            # 3. Update interval elapsed (periodic updates)
            if (last_zone is None or 
                last_zone != self.zone_id or 
                (current_time - last_time) >= self.update_interval):
                
                need_updates.add(label)
                self.person_zones[label] = self.zone_id
                self.last_update[label] = current_time
                
                logger.info(f"📍 Zone update needed: {label} → Zone {self.zone_id}")
        
        return need_updates
    
    def get_active_count(self) -> int:
        """Get number of currently visible persons"""
        return len(self.active_persons)
    
    def cleanup_inactive(self, timeout: float = 10.0):
        """
        Remove persons not seen recently
        
        Args:
            timeout: Seconds before considering person inactive
        """
        current_time = time.time()
        inactive = []
        
        for label, last_seen in list(self.active_persons.items()):
            if (current_time - last_seen) > timeout:
                inactive.append(label)
        
        for label in inactive:
            del self.active_persons[label]
            logger.info(f"🚶 Person inactive: {label}")
    
    def reset(self):
        """Reset tracker state"""
        self.person_zones.clear()
        self.last_update.clear()
        self.active_persons.clear()


class LiveZoneTrackingSystem:
    """Main live zone tracking system"""
    
    def __init__(self, config: Dict = None):
        """
        Initialize zone tracking system
        
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
        self.backend_api = ZoneTrackingAPI(self.config)
        self.backend_api.login()
        
        # Initialize zone tracker
        zone_id = self.config.get('default_zone_id', 1)
        update_interval = self.config.get('zone_update_interval', 60.0)
        self.tracker = ZoneTracker(zone_id, update_interval)
        
        # Recognition settings
        self.tolerance = self.config.get('recognition_tolerance', 0.6)
        self.process_every_n_frames = self.config.get('process_every_n_frames', 2)
        self.resize_scale = self.config.get('resize_scale', 0.25)
        
        # Camera settings
        self.camera_source = self.config.get('camera_source', 0)
        self.camera_width = self.config.get('camera_width', 640)
        self.camera_height = self.config.get('camera_height', 480)
        
        # Frame counter and FPS
        self.frame_count = 0
        self.fps_counter = FPSCounter()
        
        logger.info(f"Zone tracking system initialized for Zone {zone_id}")
    
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
    
    def handle_zone_update(self, label: str):
        """
        Handle zone update for a person
        
        Args:
            label: Person label (e.g., "STUDENT_5")
        """
        if label == "Unknown":
            return
        
        person_type, person_id = self.parse_label(label)
        
        # Send to backend
        success, _ = self.backend_api.send_zone_update(
            person_type=person_type,
            person_id=person_id,
            zone_id=self.tracker.zone_id
        )
        
        if success:
            logger.info(f"✅ Zone update sent: {label} in Zone {self.tracker.zone_id}")
        else:
            logger.warning(f"⚠️  Zone update failed: {label}")
    
    def run(self):
        """Run live zone tracking system"""
        logger.info("Starting live zone tracking...")
        logger.info(f"Opening camera: {self.camera_source}")
        logger.info(f"Tracking Zone: {self.tracker.zone_id}")
        
        # Open camera
        video_capture = cv2.VideoCapture(self.camera_source)
        
        if not video_capture.isOpened():
            raise RuntimeError(f"Failed to open camera: {self.camera_source}")
        
        # Set camera resolution
        video_capture.set(cv2.CAP_PROP_FRAME_WIDTH, self.camera_width)
        video_capture.set(cv2.CAP_PROP_FRAME_HEIGHT, self.camera_height)
        
        logger.info("✅ Camera opened successfully")
        logger.info("Press 'q' to quit, 's' to sync offline entries, 'r' to reset tracker")
        
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
                need_updates = self.tracker.update(recognized_labels)
                
                # Send zone updates
                for label in need_updates:
                    self.handle_zone_update(label)
                
                # Cleanup inactive persons
                if self.frame_count % 100 == 0:  # Every 100 frames
                    self.tracker.cleanup_inactive()
                
                # Draw results
                for label, box in recognized.items():
                    color = (0, 255, 0) if label != "Unknown" else (0, 0, 255)
                    draw_face_box(frame, box, label, color)
                
                # Update FPS
                fps = self.fps_counter.update()
                
                # Draw info panel
                backend_status = "Connected" if self.backend_api.is_online else "Offline"
                zone_text = f"Zone {self.tracker.zone_id}"
                
                # Draw zone info
                cv2.putText(frame, zone_text, (10, frame.shape[0] - 10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                
                draw_info_panel(
                    frame,
                    fps,
                    self.tracker.get_active_count(),
                    backend_status
                )
                
                # Display frame
                cv2.imshow(f'IntelliSight - Zone {self.tracker.zone_id} Tracking', frame)
                
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
    
    parser = argparse.ArgumentParser(description="IntelliSight Live Zone Tracking")
    parser.add_argument('--camera', type=int, default=0,
                       help='Camera index (default: 0)')
    parser.add_argument('--zone', type=int, default=1,
                       help='Zone ID to track (default: 1)')
    parser.add_argument('--tolerance', type=float, default=0.6,
                       help='Recognition tolerance (default: 0.6, lower = stricter)')
    parser.add_argument('--method', type=str, default='dnn', choices=['haar', 'dnn'],
                       help='Face detection method (default: dnn)')
    parser.add_argument('--update-interval', type=float, default=60.0,
                       help='Zone update interval in seconds (default: 60)')
    
    args = parser.parse_args()
    
    try:
        # Load config
        config = load_config()
        
        # Override with command line arguments
        config['camera_source'] = args.camera
        config['default_zone_id'] = args.zone
        config['recognition_tolerance'] = args.tolerance
        config['detection_method'] = args.method
        config['zone_update_interval'] = args.update_interval
        
        # Initialize and run system
        system = LiveZoneTrackingSystem(config)
        system.run()
    
    except KeyboardInterrupt:
        logger.info("\n⚠️  Interrupted by user")
    except Exception as e:
        logger.error(f"❌ Error: {e}", exc_info=True)
    finally:
        logger.info("Shutting down...")
