"""
IntelliSight - Zone-Based Backend API Integration
Author: IntelliSight Team
Description: Send zone tracking data to backend (no attendance logging)

This module handles:
1. Authentication with backend (JWT tokens)
2. Sending zone presence records (POST /api/timetable/zone)
3. Offline mode with local logging
4. Auto-sync when backend reconnects

Zone Tracking Only - No entry/exit attendance logging
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Optional, Tuple, List
from utils import (
    setup_logging, 
    load_config, 
    save_offline_entry, 
    load_offline_entries, 
    clear_offline_entries
)

logger = setup_logging()


class ZoneTrackingAPI:
    """Backend API client for zone tracking with offline support"""
    
    def __init__(self, config: Dict = None):
        """
        Initialize Zone Tracking API client
        
        Args:
            config: Configuration dictionary (if None, loads from .env)
        """
        self.config = config or load_config()
        
        self.backend_url = self.config.get('backend_url', 'http://localhost:3000')
        self.api_base_url = self.config.get('api_base_url', f'{self.backend_url}/api')
        self.admin_email = self.config.get('admin_email')
        self.admin_password = self.config.get('admin_password')
        
        self.default_zone_id = self.config.get('default_zone_id', 1)
        
        self.enable_offline_mode = self.config.get('enable_offline_mode', True)
        self.offline_log_file = self.config.get('offline_log_file', 'logs/offline_zones.json')
        self.sync_interval = self.config.get('sync_interval', 30)
        
        self.token = None
        self.is_online = False
        self.last_sync_time = time.time()
        
        logger.info(f"Zone Tracking API initialized: {self.api_base_url}")
    
    def login(self) -> bool:
        """
        Login to backend and get JWT token
        
        Returns:
            True if login successful, False otherwise
        """
        try:
            url = f"{self.api_base_url}/auth/login"
            payload = {
                "email": self.admin_email,
                "password": self.admin_password
            }
            
            response = requests.post(url, json=payload, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.token = data['data']['token']
                    self.is_online = True
                    logger.info("✅ Login successful")
                    return True
            
            logger.error(f"Login failed: {response.text}")
            return False
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Login failed - backend unreachable: {e}")
            self.is_online = False
            return False
    
    def _get_headers(self) -> Dict[str, str]:
        """Get request headers with authentication token"""
        return {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.token}' if self.token else ''
        }
    
    def check_connection(self) -> bool:
        """
        Check if backend is reachable
        
        Returns:
            True if backend is online, False otherwise
        """
        try:
            url = f"{self.backend_url}/health"
            response = requests.get(url, timeout=3)
            
            if response.status_code == 200:
                data = response.json()
                self.is_online = data.get('success', False)
                return self.is_online
        
        except requests.exceptions.RequestException:
            self.is_online = False
            return False
    
    def send_zone_update(self, person_type: str, person_id: int, 
                         zone_id: int = None, timestamp: str = None) -> Tuple[bool, Optional[Dict]]:
        """
        Send zone presence update to backend
        
        Args:
            person_type: "STUDENT" or "TEACHER"
            person_id: Person ID (integer)
            zone_id: Zone ID (uses default if None)
            timestamp: ISO format timestamp (uses current time if None)
            
        Returns:
            Tuple of (success, response_data)
        """
        zone_id = zone_id or self.default_zone_id
        timestamp = timestamp or datetime.now().isoformat()
        
        payload = {
            "personType": person_type,
            "personId": person_id,
            "zoneId": zone_id,
            "timestamp": timestamp
        }
        
        # Try to send to backend
        if self.token and self.is_online:
            try:
                url = f"{self.api_base_url}/timetable/zone"
                response = requests.post(
                    url, 
                    json=payload, 
                    headers=self._get_headers(),
                    timeout=5
                )
                
                if response.status_code in [200, 201]:
                    data = response.json()
                    if data.get('success'):
                        logger.info(f"✅ Zone update: {person_type} #{person_id} in Zone {zone_id}")
                        return True, data.get('data')
                
                logger.warning(f"Zone update failed: {response.text}")
            
            except requests.exceptions.RequestException as e:
                logger.error(f"Failed to send zone update: {e}")
                self.is_online = False
        
        # Save offline if enabled
        if self.enable_offline_mode:
            payload['type'] = 'zone_update'
            save_offline_entry(payload, self.offline_log_file)
            logger.info(f"💾 Zone update saved offline: {person_type} #{person_id} → Zone {zone_id}")
            return True, None
        
        return False, None
    
    def sync_offline_entries(self) -> Tuple[int, int]:
        """
        Sync offline zone updates to backend
        
        Returns:
            Tuple of (successful_syncs, failed_syncs)
        """
        # Check if we should sync
        current_time = time.time()
        if current_time - self.last_sync_time < self.sync_interval:
            return 0, 0
        
        self.last_sync_time = current_time
        
        # Load offline entries
        offline_entries = load_offline_entries(self.offline_log_file)
        
        if not offline_entries:
            return 0, 0
        
        # Check backend connection
        if not self.check_connection():
            logger.warning("Backend offline - sync postponed")
            return 0, 0
        
        # Re-login if needed
        if not self.token:
            if not self.login():
                return 0, 0
        
        logger.info(f"Syncing {len(offline_entries)} offline zone updates...")
        
        successful = 0
        failed = 0
        synced_entries = []
        
        for entry in offline_entries:
            try:
                person_type = entry.get('personType')
                person_id = entry.get('personId')
                zone_id = entry.get('zoneId')
                timestamp = entry.get('timestamp')
                
                success, _ = self.send_zone_update(
                    person_type, person_id, zone_id, timestamp
                )
                
                if success:
                    successful += 1
                    synced_entries.append(entry)
                else:
                    failed += 1
            
            except Exception as e:
                logger.error(f"Error syncing entry: {e}")
                failed += 1
        
        # Clear synced entries
        if synced_entries:
            remaining_entries = [e for e in offline_entries if e not in synced_entries]
            
            if remaining_entries:
                # Save remaining entries
                with open(self.offline_log_file, 'w') as f:
                    json.dump(remaining_entries, f, indent=2)
            else:
                # Clear file if all synced
                clear_offline_entries(self.offline_log_file)
        
        logger.info(f"Sync complete: {successful} successful, {failed} failed")
        return successful, failed
    
    def get_status(self) -> Dict:
        """
        Get backend connection status
        
        Returns:
            Status dictionary
        """
        return {
            'online': self.is_online,
            'authenticated': self.token is not None,
            'backend_url': self.backend_url,
            'offline_entries': len(load_offline_entries(self.offline_log_file))
        }


# Convenience functions
_api_instance = None

def get_api_instance(config: Dict = None) -> ZoneTrackingAPI:
    """Get singleton API instance"""
    global _api_instance
    if _api_instance is None:
        _api_instance = ZoneTrackingAPI(config)
    return _api_instance


def send_zone_update(person_type: str, person_id: int, zone_id: int = None) -> bool:
    """
    Send zone update to backend
    
    Args:
        person_type: "STUDENT" or "TEACHER"
        person_id: Person ID
        zone_id: Zone ID (optional)
        
    Returns:
        True if successful
    """
    api = get_api_instance()
    
    # Login if needed
    if not api.token:
        api.login()
    
    success, _ = api.send_zone_update(person_type, person_id, zone_id)
    return success


if __name__ == "__main__":
    # Test zone tracking integration
    print("Testing Zone Tracking API Integration...")
    
    # Initialize API
    api = ZoneTrackingAPI()
    
    # Test connection
    print(f"\n1. Testing connection to {api.backend_url}...")
    if api.check_connection():
        print("✅ Backend is online")
    else:
        print("❌ Backend is offline")
    
    # Test login
    print(f"\n2. Testing login with {api.admin_email}...")
    if api.login():
        print(f"✅ Login successful. Token: {api.token[:20]}...")
    else:
        print("❌ Login failed")
    
    # Test sending zone update
    print("\n3. Testing zone update (TEST - student #999 in zone 1)...")
    success, data = api.send_zone_update("STUDENT", 999, zone_id=1)
    if success:
        print(f"✅ Zone update sent successfully")
        if data:
            print(f"   Response: {data}")
    else:
        print(f"❌ Zone update failed (check if saved offline)")
    
    # Test another zone
    print("\n4. Testing zone update (TEST - student #999 in zone 2)...")
    success, data = api.send_zone_update("STUDENT", 999, zone_id=2)
    if success:
        print(f"✅ Zone update sent successfully")
    
    # Test status
    print("\n5. Checking status...")
    status = api.get_status()
    print(f"   Online: {status['online']}")
    print(f"   Authenticated: {status['authenticated']}")
    print(f"   Offline entries: {status['offline_entries']}")
    
    print("\n✅ All tests completed!")
