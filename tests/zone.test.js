import { describe, test, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';

describe('Zone API', () => {
  let authToken;
  let createdZoneId;

  beforeAll(async () => {
    // Register and login to get auth token
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'john.admin@intellisight.com',
        password: 'admin123',
      });

    authToken = response.body.data.token;
  });

  describe('POST /api/zones', () => {
    test('should create a new zone', async () => {
      const response = await request(app)
        .post('/api/zones')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          Zone_Name: 'Test Zone - Jest',
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('Zone_id');
      expect(response.body.data).toHaveProperty('Zone_Name', 'Test Zone - Jest');

      createdZoneId = response.body.data.Zone_id;
    });

    test('should reject request without auth token', async () => {
      await request(app)
        .post('/api/zones')
        .send({
          Zone_Name: 'Unauthorized Zone',
        })
        .expect(401);
    });
  });

  describe('GET /api/zones', () => {
    test('should get all zones', async () => {
      const response = await request(app)
        .get('/api/zones')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/zones/:id', () => {
    test('should get zone by ID', async () => {
      const response = await request(app)
        .get(`/api/zones/${createdZoneId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('Zone_id', createdZoneId);
      expect(response.body.data).toHaveProperty('Zone_Name');
    });

    test('should return 404 for non-existent zone', async () => {
      await request(app)
        .get('/api/zones/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/zones/:id', () => {
    test('should update zone', async () => {
      const response = await request(app)
        .put(`/api/zones/${createdZoneId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          Zone_Name: 'Updated Test Zone',
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('Zone_Name', 'Updated Test Zone');
    });
  });

  describe('DELETE /api/zones/:id', () => {
    test('should delete zone', async () => {
      const response = await request(app)
        .delete(`/api/zones/${createdZoneId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('should return 404 when deleting non-existent zone', async () => {
      await request(app)
        .delete(`/api/zones/${createdZoneId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
