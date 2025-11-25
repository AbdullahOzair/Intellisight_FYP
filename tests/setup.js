import { beforeAll, afterAll } from '@jest/globals';
import { prisma } from '../src/config/database.js';

// Setup before all tests
beforeAll(async () => {
  // Connect to database
  await prisma.$connect();
});

// Cleanup after all tests
afterAll(async () => {
  // Disconnect from database
  await prisma.$disconnect();
});

// Global test timeout
jest.setTimeout(10000);
