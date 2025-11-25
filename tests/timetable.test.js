import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/database.js';

describe('TimeTable API - Entry/Exit Logic', () => {
  let authToken;
  let testStudentId;
  let testTeacherId;
  let testZoneId;

  beforeAll(async () => {
    // Login to get auth token
    const authResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'john.admin@intellisight.com',
        password: 'admin123',
      });

    authToken = authResponse.body.data.token;

    // Use student/teacher IDs not in seed data with open entries
    // Seed has students 3,4,7 with open entries. Use student ID 2 for tests.
    // Seed has teacher ID 1 with open entry. Use teacher ID 2 for tests.
    testStudentId = 2; // Alice Williams - no open entry in seed
    testTeacherId = 2; // Dr. Lisa Chen - no open entry in seed
    testZoneId = 1;
  });

  // Close all open entries for test student and teacher before each test
  beforeEach(async () => {
    await prisma.timeTable.updateMany({
      where: {
        OR: [
          { Student_ID: testStudentId },
          { Teacher_ID: testTeacherId },
        ],
        ExitTime: null,
      },
      data: {
        ExitTime: new Date(),
      },
    });
  });

  describe('POST /api/timetable/entry', () => {
    test('should record entry for student', async () => {
      const response = await request(app)
        .post('/api/timetable/entry')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          personType: 'STUDENT',
          personId: testStudentId,
          zoneId: testZoneId,
          cameraId: 1,
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('TimeTable_ID');
      expect(response.body.data).toHaveProperty('EntryTime');
      expect(response.body.data).toHaveProperty('ExitTime', null);
      expect(response.body.data).toHaveProperty('PersonType', 'STUDENT');
    });

    test('should prevent duplicate entry for same student', async () => {
      // First create an entry (student should have no open entry after beforeEach)
      await request(app)
        .post('/api/timetable/entry')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          personType: 'STUDENT',
          personId: testStudentId,
          zoneId: testZoneId,
        })
        .expect(201);

      // Try to create duplicate - should fail with 409
      const response = await request(app)
        .post('/api/timetable/entry')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          personType: 'STUDENT',
          personId: testStudentId,
          zoneId: testZoneId,
        })
        .expect('Content-Type', /json/)
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('already has an active entry');
    });

    test('should record entry for teacher', async () => {
      const response = await request(app)
        .post('/api/timetable/entry')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          personType: 'TEACHER',
          personId: testTeacherId,
          zoneId: testZoneId,
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('PersonType', 'TEACHER');
    });

    test('should reject invalid person type', async () => {
      await request(app)
        .post('/api/timetable/entry')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          personType: 'INVALID',
          personId: testStudentId,
          zoneId: testZoneId,
        })
        .expect(422);
    });

    test('should reject non-existent person', async () => {
      await request(app)
        .post('/api/timetable/entry')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          personType: 'STUDENT',
          personId: 999999,
          zoneId: testZoneId,
        })
        .expect(404);
    });
  });

  describe('POST /api/timetable/exit', () => {
    test('should record exit for student with open entry', async () => {
      const response = await request(app)
        .post('/api/timetable/exit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          personType: 'STUDENT',
          personId: testStudentId,
          zoneId: testZoneId,
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('ExitTime');
      expect(response.body.data.ExitTime).not.toBeNull();
    });

    test('should handle exit without entry (creates exit-only record)', async () => {
      // First ensure student has no open entry
      await request(app)
        .post('/api/timetable/exit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          personType: 'STUDENT',
          personId: testStudentId,
        });

      // Now record another exit (no open entry)
      const response = await request(app)
        .post('/api/timetable/exit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          personType: 'STUDENT',
          personId: testStudentId,
          zoneId: testZoneId,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('ExitTime');
    });

    test('should record exit for teacher', async () => {
      const response = await request(app)
        .post('/api/timetable/exit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          personType: 'TEACHER',
          personId: testTeacherId,
          zoneId: testZoneId,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/timetable/active', () => {
    test('should get all currently active persons', async () => {
      // First create a new entry for a student who doesn't have an open entry
      await request(app)
        .post('/api/timetable/entry')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          personType: 'STUDENT',
          personId: 5, // Different student from our main test student (ID 2)
          zoneId: testZoneId,
        });

      const response = await request(app)
        .get('/api/timetable/active')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('count');
      expect(response.body.data).toHaveProperty('activePersons');
      expect(Array.isArray(response.body.data.activePersons)).toBe(true);
    });
  });

  describe('GET /api/timetable', () => {
    test('should query timetable entries', async () => {
      const response = await request(app)
        .get('/api/timetable')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('pagination');
    });

    test('should filter by zone', async () => {
      const response = await request(app)
        .get(`/api/timetable?zoneId=${testZoneId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('should filter by person type', async () => {
      const response = await request(app)
        .get('/api/timetable?personType=STUDENT')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('should filter by date range', async () => {
      const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const to = new Date().toISOString();

      const response = await request(app)
        .get(`/api/timetable?from=${from}&to=${to}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/timetable/analytics', () => {
    test('should get analytics data', async () => {
      const response = await request(app)
        .get('/api/timetable/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('totalEntriesToday');
      expect(response.body.data).toHaveProperty('activeNow');
      expect(response.body.data).toHaveProperty('entriesByZone');
      expect(response.body.data).toHaveProperty('entriesByPersonType');
    });
  });
});
