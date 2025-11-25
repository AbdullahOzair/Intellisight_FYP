/**
 * Zone 1 Live Tracking Page
 * Real-time face recognition and tracking for Zone 1
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiRefreshCw, FiAlertCircle, FiCheckCircle, FiX } from 'react-icons/fi';
import LiveCameraFeed from '../components/Zone1/LiveCameraFeed';
import ZoneLogs from '../components/Zone1/ZoneLogs';
import CurrentPersons from '../components/Zone1/CurrentPersons';
import { zone1API } from '../api/zone1';
import { unknownFacesAPI } from '../api/unknownFaces';
import * as faceRecognition from '../utils/faceRecognition';

const Zone1 = () => {
  // State
  const [faceDatabase, setFaceDatabase] = useState({ students: [], teachers: [] });
  const [currentPersons, setCurrentPersons] = useState([]);
  const [logs, setLogs] = useState([]);
  const [unknownLogs, setUnknownLogs] = useState([]);
  const [detections, setDetections] = useState([]);
  const [matches, setMatches] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [stats, setStats] = useState({
    totalRecognized: 0,
    totalUnknown: 0,
    knownInZone: 0,
    unknownInZone: 0
  });

  // Refs
  const webcamRef = useRef(null);
  const processingRef = useRef(false);
  const recognizedPersonsRef = useRef(new Set()); // Track known persons {type-id}
  const unknownPersonsRef = useRef(new Set()); // Track unknown persons by time window
  const lastUnknownDetectionRef = useRef(0); // Track last unknown detection time

  // Load face-api.js models and face database on mount
  useEffect(() => {
    initializeFaceRecognition();
  }, []);

  const initializeFaceRecognition = async () => {
    try {
      setError(null);
      
      // Load face-api.js models
      console.log('🔄 Loading face recognition models...');
      const modelsLoaded = await faceRecognition.loadModels();
      
      if (!modelsLoaded) {
        throw new Error('Failed to load face recognition models. Please check if model files exist in /public/models/');
      }

      setModelsLoaded(true);
      console.log('✅ Models loaded successfully');

      // Load face database from backend
      console.log('🔄 Loading face database...');
      const response = await zone1API.getFaceDatabase();
      
      if (response?.success && response.data) {
        setFaceDatabase(response.data);
        await faceRecognition.loadFaceDatabase(response.data);
        console.log(`✅ Loaded ${response.data.total || 0} faces`);
        setSuccess(`Face recognition initialized with ${response.data.total || 0} known faces`);
        setTimeout(() => setSuccess(null), 5000);
      } else {
        console.warn('⚠️ No face database loaded - all faces will be marked as unknown');
        setFaceDatabase({ students: [], teachers: [] });
      }

      // Start detection interval
      startFaceDetection();

    } catch (err) {
      console.error('❌ Initialization error:', err);
      const errorMessage = err.message || 'Failed to initialize face recognition';
      
      // Check for specific error types
      if (err.message?.includes('models')) {
        setError('Model loading failed. Please ensure face-api.js models are in /public/models/');
      } else if (err.message?.includes('camera') || err.message?.includes('webcam')) {
        setError('Camera access denied. Please allow camera permissions and refresh.');
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        setError('Cannot connect to backend server. Please ensure it\'s running on port 3000.');
      } else {
        setError(errorMessage);
      }
    }
  };

  // Start continuous face detection
  const startFaceDetection = () => {
    console.log('🎬 Starting face detection interval...');
    
    const detectionInterval = setInterval(async () => {
      if (processingRef.current) {
        console.log('⏭️ Skipping detection - already processing');
        return;
      }
      
      // Get video element
      const webcam = webcamRef.current?.video || document.querySelector('video');
      
      if (!webcam) {
        return;
      }
      
      if (!modelsLoaded) {
        return;
      }

      // Ensure video is playing and has dimensions
      if (webcam.readyState !== 4 || webcam.videoWidth === 0 || webcam.videoHeight === 0) {
        return;
      }

      processingRef.current = true;
      setIsProcessing(true);

      try {
        // Detect faces
        const detected = await faceRecognition.detectFaces(webcam, {
          withLandmarks: true,
          withDescriptors: true,
          withExpressions: false
        });

        console.log(`✅ Detection complete: ${detected.length} face(s) found`);
        setDetections(detected);

        // Match faces
        const matched = detected.map(detection => {
          if (!detection.descriptor) return null;
          return faceRecognition.matchFace(detection.descriptor, 0.6);
        });

        setMatches(matched);

        // Track current session detections
        let knownCount = 0;
        let unknownCount = 0;

        // Log recognized/unknown persons
        for (let i = 0; i < matched.length; i++) {
          const match = matched[i];
          const detection = detected[i];

          if (match) {
            // Recognized person (KNOWN)
            knownCount++;
            const personKey = `${match.type}-${match.id}`;
            
            if (!recognizedPersonsRef.current.has(personKey)) {
              await handleRecognizedPerson(match);
              recognizedPersonsRef.current.add(personKey);
              
              // Remove from set after 5 minutes to allow re-entry
              setTimeout(() => {
                recognizedPersonsRef.current.delete(personKey);
              }, 5 * 60 * 1000);
            }
          } else {
            // Unknown person - only log once every 10 seconds to prevent spam
            unknownCount++;
            const now = Date.now();
            const timeSinceLastUnknown = now - lastUnknownDetectionRef.current;
            
            // Capture on first detection or after 10 second cooldown
            if (lastUnknownDetectionRef.current === 0 || timeSinceLastUnknown > 10000) {
              try {
                await handleUnknownPerson(webcam, detection);
                lastUnknownDetectionRef.current = now;
              } catch (error) {
                console.error('❌ Unknown person capture failed:', error);
              }
            }
          }
        }

        // Update real-time zone counts based on CURRENT detections only
        setStats(prev => ({
          ...prev,
          knownInZone: knownCount,
          unknownInZone: unknownCount
        }));

      } catch (err) {
        console.error('Detection error:', err);
      } finally {
        processingRef.current = false;
        setIsProcessing(false);
      }
    }, 3000); // Run every 3 seconds

    // Cleanup on unmount
    return () => {
      clearInterval(detectionInterval);
      processingRef.current = false;
    };
  };

  // Handle recognized person
  const handleRecognizedPerson = async (match) => {
    try {
      console.log('✅ Recognized:', match.name);
      
      await zone1API.logRecognizedPerson(
        match.id,
        match.type,
        parseFloat(match.confidence)
      );

      setStats(prev => ({
        ...prev,
        totalRecognized: prev.totalRecognized + 1
      }));

      await fetchCurrentPersons();
      await fetchLogs();

    } catch (err) {
      console.error('Error logging recognized person:', err);
    }
  };

  // Handle unknown person
  const handleUnknownPerson = async (videoElement, detection) => {
    try {
      console.log('🖌️ Starting face image extraction...');
      
      // Extract face image
      const faceImage = await faceRecognition.extractFaceImage(videoElement, detection);
      
      if (faceImage) {
        console.log('✅ Face image extracted successfully');
        console.log('📤 Sending to backend API...');
        
        const response = await zone1API.logUnknownPerson(faceImage, 0, 'Detected by live camera');
        
        console.log('📥 Backend response:', response);

        setStats(prev => ({
          ...prev,
          totalUnknown: prev.totalUnknown + 1
        }));
        
        // Refresh logs to show new entry
        await fetchLogs();
        
        setSuccess('Unknown person captured and logged!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        console.error('❌ Failed to extract face image');
      }

    } catch (err) {
      console.error('❌ Error logging unknown person:', err);
      console.error('Error details:', err.message);
      console.error('Stack trace:', err.stack);
      setError('Failed to capture unknown person: ' + err.message);
      setTimeout(() => setError(null), 5000);
    }
  };

  // Fetch current persons in zone
  const fetchCurrentPersons = async () => {
    try {
      const response = await zone1API.getCurrentPersons();
      if (response.success) {
        setCurrentPersons(response.data);
      }
    } catch (err) {
      console.error('Error fetching current persons:', err);
    }
  };

  // Manual detection test
  const runManualDetection = async () => {
    const webcam = webcamRef.current?.video || document.querySelector('video');
    if (!webcam) {
      setError('Camera not ready');
      return;
    }

    setIsProcessing(true);
    try {
      console.log('🔍 Running manual detection test...');
      console.log('Video element:', webcam);
      console.log('Video ready state:', webcam.readyState);
      console.log('Video dimensions:', webcam.videoWidth, 'x', webcam.videoHeight);
      
      const detected = await faceRecognition.detectFaces(webcam, {
        withLandmarks: true,
        withDescriptors: true
      });
      
      console.log('✅ Manual detection result:', detected);
      setSuccess(`Manual test: ${detected.length} face(s) detected`);
      setDetections(detected);
      
      // Match faces
      const matched = detected.map(detection => {
        if (!detection.descriptor) return null;
        return faceRecognition.matchFace(detection.descriptor, 0.6);
      });
      setMatches(matched);
      
    } catch (err) {
      console.error('❌ Manual detection error:', err);
      setError('Manual detection failed: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Fetch activity logs
  const fetchLogs = async () => {
    try {
      const [knownResponse, unknownResponse] = await Promise.all([
        zone1API.getZoneLogs(20),
        unknownFacesAPI.getUnknownFaces(20)
      ]);
      
      if (knownResponse.success) {
        setLogs(knownResponse.data);
      }
      
      if (unknownResponse.success) {
        setUnknownLogs(unknownResponse.data);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };

  // Mark person exit
  const handleMarkExit = async (timetableId) => {
    try {
      await zone1API.markExit(timetableId);
      setSuccess('Exit marked successfully');
      await fetchCurrentPersons();
      await fetchLogs();
    } catch (err) {
      setError('Failed to mark exit');
    }
  };

  // Load initial logs only (no auto-refresh of database entries)
  useEffect(() => {
    fetchLogs(); // Load activity history
    
    // Auto-refresh logs every 10 seconds to see new entries
    const interval = setInterval(() => {
      fetchLogs();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Zone 1 - Live Tracking</h1>
          <p className="text-gray-600 mt-1">Real-time face recognition and monitoring</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={runManualDetection}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            disabled={isProcessing}
          >
            <FiCheckCircle size={16} />
            <span>Test Detection</span>
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <FiRefreshCw size={16} />
            <span>Restart System</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start justify-between">
          <div className="flex items-start">
            <FiAlertCircle className="text-red-500 mt-0.5 mr-3 flex-shrink-0" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
          <button onClick={() => setError(null)}>
            <FiX className="text-red-500" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start justify-between">
          <div className="flex items-start">
            <FiCheckCircle className="text-green-500 mt-0.5 mr-3 flex-shrink-0" size={20} />
            <p className="text-green-700">{success}</p>
          </div>
          <button onClick={() => setSuccess(null)}>
            <FiX className="text-green-500" />
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Known in Zone</p>
              <p className="text-3xl font-bold text-green-600">{stats.knownInZone}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <FiCheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unknown in Zone</p>
              <p className="text-3xl font-bold text-red-600">{stats.unknownInZone}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <FiAlertCircle className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Recognized</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalRecognized}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FiCheckCircle className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Unknown</p>
              <p className="text-3xl font-bold text-orange-600">{stats.totalUnknown}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <FiAlertCircle className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Camera Feed */}
        <div className="lg:col-span-2">
          <LiveCameraFeed
            webcamRef={webcamRef}
            onFaceDetection={() => {}}
            isProcessing={isProcessing}
            detections={detections}
            matches={matches}
          />
        </div>

        {/* Right: Live Logs */}
        <div className="lg:col-span-1">
          <ZoneLogs 
            knownLogs={logs} 
            unknownLogs={unknownLogs}
            loading={false} 
          />
        </div>
      </div>

      {/* Bottom: Live Detection Info */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Live Detection Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <h3 className="font-semibold text-green-800">Known Persons Detected</h3>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.knownInZone}</p>
            <p className="text-sm text-gray-600 mt-1">People recognized from database</p>
          </div>
          
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <h3 className="font-semibold text-red-800">Unknown Persons Detected</h3>
            </div>
            <p className="text-3xl font-bold text-red-600">{stats.unknownInZone}</p>
            <p className="text-sm text-gray-600 mt-1">Faces not in database</p>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Counts update in real-time based on current camera detections.
            Green boxes = Known persons | Red boxes = Unknown persons
          </p>
        </div>
      </div>
    </div>
  );
};

export default Zone1;
