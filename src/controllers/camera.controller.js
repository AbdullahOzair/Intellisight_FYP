import asyncHandler from 'express-async-handler';
import { prisma } from '../config/database.js';
import { successResponse } from '../utils/response.js';
import { NotFoundError } from '../utils/errors.js';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../config/constants.js';

/**
 * @route   GET /api/cameras
 * @desc    Get all cameras
 * @access  Private
 */
export const getAllCameras = asyncHandler(async (req, res) => {
  const cameras = await prisma.camara.findMany({
    include: {
      zone: {
        select: {
          Zone_id: true,
          Zone_Name: true,
        },
      },
      _count: {
        select: {
          Teacher: true,
          Students: true,
        },
      },
    },
    orderBy: { Camara_Id: 'asc' },
  });

  successResponse(res, cameras, 'Cameras retrieved successfully');
});

/**
 * @route   GET /api/cameras/:id
 * @desc    Get camera by ID
 * @access  Private
 */
export const getCameraById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const camera = await prisma.camara.findUnique({
    where: { Camara_Id: id },
    include: {
      zone: {
        select: {
          Zone_id: true,
          Zone_Name: true,
        },
      },
      Teacher: {
        select: {
          Teacher_ID: true,
          Name: true,
          Email: true,
        },
      },
      Students: {
        select: {
          Student_ID: true,
          Name: true,
          Email: true,
        },
      },
    },
  });

  if (!camera) {
    throw new NotFoundError(`Camera with ID ${id} not found`);
  }

  successResponse(res, camera, 'Camera retrieved successfully');
});

/**
 * @route   POST /api/cameras
 * @desc    Create new camera
 * @access  Private
 */
export const createCamera = asyncHandler(async (req, res) => {
  const { Password, Zone_id } = req.body;

  const camera = await prisma.camara.create({
    data: {
      Password,
      Zone_id,
    },
    include: {
      zone: {
        select: {
          Zone_id: true,
          Zone_Name: true,
        },
      },
    },
  });

  successResponse(
    res,
    camera,
    SUCCESS_MESSAGES.CREATED,
    HTTP_STATUS.CREATED
  );
});

/**
 * @route   PUT /api/cameras/:id
 * @desc    Update camera
 * @access  Private
 */
export const updateCamera = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { Password, Zone_id } = req.body;

  // Check if camera exists
  const existingCamera = await prisma.camara.findUnique({
    where: { Camara_Id: id },
  });

  if (!existingCamera) {
    throw new NotFoundError(`Camera with ID ${id} not found`);
  }

  const updateData = {};
  if (Password !== undefined) updateData.Password = Password;
  if (Zone_id !== undefined) updateData.Zone_id = Zone_id;

  const camera = await prisma.camara.update({
    where: { Camara_Id: id },
    data: updateData,
    include: {
      zone: {
        select: {
          Zone_id: true,
          Zone_Name: true,
        },
      },
    },
  });

  successResponse(res, camera, SUCCESS_MESSAGES.UPDATED);
});

/**
 * @route   DELETE /api/cameras/:id
 * @desc    Delete camera
 * @access  Private
 */
export const deleteCamera = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if camera exists
  const existingCamera = await prisma.camara.findUnique({
    where: { Camara_Id: id },
  });

  if (!existingCamera) {
    throw new NotFoundError(`Camera with ID ${id} not found`);
  }

  await prisma.camara.delete({
    where: { Camara_Id: id },
  });

  successResponse(
    res,
    { Camara_Id: id },
    SUCCESS_MESSAGES.DELETED,
    HTTP_STATUS.OK
  );
});
