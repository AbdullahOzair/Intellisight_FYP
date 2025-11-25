import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { UnauthorizedError, ConflictError } from '../utils/errors.js';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Hash password using bcrypt
 */
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, BCRYPT_ROUNDS);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate JWT token
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verify JWT token
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired token');
  }
};

/**
 * Register new admin
 */
export const registerAdmin = async ({ name, email, password, role }) => {
  // Check if email already exists
  const existingAdmin = await prisma.admin.findUnique({
    where: { Email: email },
  });

  if (existingAdmin) {
    throw new ConflictError('Email already exists');
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create admin
  const admin = await prisma.admin.create({
    data: {
      Name: name,
      Email: email,
      Password: hashedPassword,
      Role: role,
    },
    select: {
      Admin_ID: true,
      Name: true,
      Email: true,
      Role: true,
    },
  });

  // Generate token
  const token = generateToken({
    adminId: admin.Admin_ID,
    email: admin.Email,
    role: admin.Role,
  });

  return { admin, token };
};

/**
 * Login admin
 */
export const loginAdmin = async ({ email, password }) => {
  // Find admin by email
  const admin = await prisma.admin.findUnique({
    where: { Email: email },
  });

  if (!admin) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Compare password
  const isPasswordValid = await comparePassword(password, admin.Password);

  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Generate token
  const token = generateToken({
    adminId: admin.Admin_ID,
    email: admin.Email,
    role: admin.Role,
  });

  // Return admin without password
  const { Password, ...adminWithoutPassword } = admin;

  return { admin: adminWithoutPassword, token };
};
