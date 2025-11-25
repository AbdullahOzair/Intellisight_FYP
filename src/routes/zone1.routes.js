/**
 * Zone 1 Live Tracking Routes
 * Real-time face recognition and tracking endpoints
 */

import express from 'express';
import * as zone1Controller from '../controllers/zone1.controller.js';

const router = express.Router();

import { authenticateToken } from '../middlewares/auth.js';

// All routes require authentication
router.use(authenticateToken);

// Log recognized person entry
router.post('/recognize', zone1Controller.logRecognizedPerson);

// Log unknown person detection
router.post('/unknown', zone1Controller.logUnknownPerson);

// Get all persons currently in Zone 1
router.get('/current', zone1Controller.getCurrentPersons);

// Get Zone 1 activity logs
router.get('/logs', zone1Controller.getZoneLogs);

// Get face database for matching
router.get('/face-database', zone1Controller.getFaceDatabase);

// Mark person exit
router.put('/exit/:timetableId', zone1Controller.markExit);

// Get unknown faces log
router.get('/unknown-list', zone1Controller.getUnknownFaces);

// Update unknown face status
router.put('/unknown/:unknownId', zone1Controller.updateUnknownFaceStatus);

// Delete unknown face entry
router.delete('/unknown/:unknownId', zone1Controller.deleteUnknownFace);

export default router;
