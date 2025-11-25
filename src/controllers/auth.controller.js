import asyncHandler from 'express-async-handler';
import { registerAdmin, loginAdmin } from '../services/auth.service.js';
import { successResponse } from '../utils/response.js';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../config/constants.js';

/**
 * @route   POST /api/auth/register
 * @desc    Register new admin
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const result = await registerAdmin({ name, email, password, role });

  successResponse(
    res,
    result,
    SUCCESS_MESSAGES.REGISTER_SUCCESS,
    HTTP_STATUS.CREATED
  );
});

/**
 * @route   POST /api/auth/login
 * @desc    Login admin
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await loginAdmin({ email, password });

  // Custom response format as per requirements
  res.status(HTTP_STATUS.OK).json({
    message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
    token: result.token,
    admin: result.admin,
  });
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current admin info
 * @access  Private
 */
export const getCurrentAdmin = asyncHandler(async (req, res) => {
  successResponse(res, { admin: req.user }, 'Admin info retrieved');
});
