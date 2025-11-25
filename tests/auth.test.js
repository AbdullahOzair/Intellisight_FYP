import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/database.js';
import bcrypt from 'bcryptjs';

describe('Auth Endpoints', () => {
  let adminToken;
  const testAdmin = {
    name: 'Test Admin',
    email: 'testadmin@example.com',
    password: 'password123',
    role: 'ADMIN'
  };

  beforeAll(async () => {
    // Clean up existing test user if any
    await prisma.admin.deleteMany({
      where: { Email: testAdmin.email }
    });

    // Create test admin
    const hashedPassword = await bcrypt.hash(testAdmin.password, 10);
    await prisma.admin.create({
      data: {
        Name: testAdmin.name,
        Email: testAdmin.email,
        Password: hashedPassword,
        Role: testAdmin.role
      }
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.admin.deleteMany({
      where: { Email: testAdmin.email }
    });
    await prisma.$disconnect();
  });

  it('should login successfully with correct credentials', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({
        email: testAdmin.email,
        password: testAdmin.password
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('admin');
    adminToken = res.body.token;
  });

  it('should fail login with incorrect password', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({
        email: testAdmin.email,
        password: 'wrongpassword'
      });

    expect(res.statusCode).toEqual(401);
  });

  it('should access protected route with token', async () => {
    const res = await request(app)
      .get('/api/zones')
      .set('Authorization', `Bearer ${adminToken}`);

    // Assuming /api/zones returns 200 or 404 (if no zones) but NOT 401
    expect(res.statusCode).not.toEqual(401);
  });

  it('should fail to access protected route without token', async () => {
    const res = await request(app)
      .get('/api/zones');

    expect(res.statusCode).toEqual(401);
  });
});
