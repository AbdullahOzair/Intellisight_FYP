/**
 * Zone 1 Live Tracking Controller
 * Handles real-time face recognition and tracking for Zone 1
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Log recognized person entry to Zone 1
 * POST /api/zones/1/recognize
 */
export const logRecognizedPerson = async (req, res) => {
  try {
    const { personId, personType, confidence } = req.body;

    if (!personId || !personType) {
      return res.status(400).json({
        success: false,
        message: 'Person ID and Person Type are required'
      });
    }

    // Check if person is already in zone (no exit time)
    const existingEntry = await prisma.timeTable.findFirst({
      where: {
        Zone_id: 1,
        ExitTime: null,
        ...(personType === 'TEACHER' 
          ? { Teacher_ID: parseInt(personId) }
          : { Student_ID: parseInt(personId) }
        )
      }
    });

    if (existingEntry) {
      return res.status(200).json({
        success: true,
        message: 'Person already in zone',
        data: existingEntry
      });
    }

    // Create new entry
    const entry = await prisma.timeTable.create({
      data: {
        Zone_id: 1,
        PersonType: personType,
        EntryTime: new Date(),
        ...(personType === 'TEACHER' 
          ? { Teacher_ID: parseInt(personId) }
          : { Student_ID: parseInt(personId) }
        )
      },
      include: {
        teacher: true,
        student: true,
        zone: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Person entry logged successfully',
      data: entry
    });

  } catch (error) {
    console.error('Error logging recognized person:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log person entry',
      error: error.message
    });
  }
};

/**
 * Log unknown person detection in Zone 1
 * POST /api/zones/1/unknown
 */
export const logUnknownPerson = async (req, res) => {
  try {
    const { capturedImage, confidence, notes } = req.body;

    if (!capturedImage) {
      return res.status(400).json({
        success: false,
        message: 'Captured image is required'
      });
    }

    // Convert base64 image to Buffer
    const imageBuffer = Buffer.from(capturedImage.replace(/^data:image\/\w+;base64,/, ''), 'base64');

    const unknownFace = await prisma.unknownFaces.create({
      data: {
        Captured_Image: imageBuffer,
        Zone_id: 1,
        Confidence: confidence || 0,
        DetectedTime: new Date(),
        Status: 'PENDING',
        Notes: notes || 'Unknown person detected'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Unknown person logged successfully',
      data: {
        Unknown_ID: unknownFace.Unknown_ID,
        DetectedTime: unknownFace.DetectedTime,
        Status: unknownFace.Status
      }
    });

  } catch (error) {
    console.error('Error logging unknown person:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log unknown person',
      error: error.message
    });
  }
};

/**
 * Get all persons currently in Zone 1
 * GET /api/zones/1/current
 */
export const getCurrentPersons = async (req, res) => {
  try {
    const currentPersons = await prisma.timeTable.findMany({
      where: {
        Zone_id: 1,
        ExitTime: null
      },
      include: {
        teacher: true,
        student: true,
        zone: true
      },
      orderBy: {
        EntryTime: 'desc'
      }
    });

    // Format response
    const formatted = currentPersons.map(entry => ({
      TimeTable_ID: entry.TimeTable_ID,
      PersonType: entry.PersonType,
      PersonID: entry.PersonType === 'TEACHER' ? entry.Teacher_ID : entry.Student_ID,
      Name: entry.PersonType === 'TEACHER' ? entry.teacher?.Name : entry.student?.Name,
      Email: entry.PersonType === 'TEACHER' ? entry.teacher?.Email : entry.student?.Email,
      Face_Pictures: entry.PersonType === 'TEACHER' ? entry.teacher?.Face_Pictures : entry.student?.Face_Pictures,
      EntryTime: entry.EntryTime,
      Zone: entry.zone?.Zone_Name
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted
    });

  } catch (error) {
    console.error('Error fetching current persons:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch current persons',
      error: error.message
    });
  }
};

/**
 * Get all Zone 1 activity logs
 * GET /api/zones/1/logs
 */
export const getZoneLogs = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const logs = await prisma.timeTable.findMany({
      where: {
        Zone_id: 1
      },
      include: {
        teacher: true,
        student: true,
        zone: true
      },
      orderBy: {
        EntryTime: 'desc'
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.timeTable.count({
      where: { Zone_id: 1 }
    });

    // Format response
    const formatted = logs.map(entry => ({
      TimeTable_ID: entry.TimeTable_ID,
      PersonType: entry.PersonType,
      PersonID: entry.PersonType === 'TEACHER' ? entry.Teacher_ID : entry.Student_ID,
      Name: entry.PersonType === 'TEACHER' ? entry.teacher?.Name : entry.student?.Name,
      Email: entry.PersonType === 'TEACHER' ? entry.teacher?.Email : entry.student?.Email,
      Face_Pictures: entry.PersonType === 'TEACHER' ? entry.teacher?.Face_Pictures : entry.student?.Face_Pictures,
      EntryTime: entry.EntryTime,
      ExitTime: entry.ExitTime,
      Zone: entry.zone?.Zone_Name,
      Duration: entry.ExitTime 
        ? Math.round((new Date(entry.ExitTime) - new Date(entry.EntryTime)) / 1000 / 60) + ' mins'
        : 'Ongoing'
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      total: total,
      data: formatted
    });

  } catch (error) {
    console.error('Error fetching zone logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch zone logs',
      error: error.message
    });
  }
};

/**
 * Get all students and teachers with face data for matching
 * GET /api/zones/1/face-database
 */
export const getFaceDatabase = async (req, res) => {
  try {
    const [students, teachers] = await Promise.all([
      prisma.students.findMany({
        where: {
          Face_Pictures: { not: null }
        },
        select: {
          Student_ID: true,
          Name: true,
          Email: true,
          Face_Pictures: true
        }
      }),
      prisma.teacher.findMany({
        where: {
          Face_Pictures: { not: null }
        },
        select: {
          Teacher_ID: true,
          Name: true,
          Email: true,
          Face_Pictures: true
        }
      })
    ]);

    // Convert face pictures to base64
    const studentsData = students.map(s => ({
      id: s.Student_ID,
      name: s.Name,
      email: s.Email,
      type: 'STUDENT',
      faceImage: s.Face_Pictures ? `data:image/jpeg;base64,${s.Face_Pictures.toString('base64')}` : null
    }));

    const teachersData = teachers.map(t => ({
      id: t.Teacher_ID,
      name: t.Name,
      email: t.Email,
      type: 'TEACHER',
      faceImage: t.Face_Pictures ? `data:image/jpeg;base64,${t.Face_Pictures.toString('base64')}` : null
    }));

    res.status(200).json({
      success: true,
      data: {
        students: studentsData,
        teachers: teachersData,
        total: studentsData.length + teachersData.length
      }
    });

  } catch (error) {
    console.error('Error fetching face database:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch face database',
      error: error.message
    });
  }
};

/**
 * Mark person exit from Zone 1
 * PUT /api/zones/1/exit/:timetableId
 */
export const markExit = async (req, res) => {
  try {
    const { timetableId } = req.params;

    const updated = await prisma.timeTable.update({
      where: {
        TimeTable_ID: parseInt(timetableId)
      },
      data: {
        ExitTime: new Date()
      },
      include: {
        teacher: true,
        student: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Exit time recorded',
      data: updated
    });

  } catch (error) {
    console.error('Error marking exit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark exit',
      error: error.message
    });
  }
};

/**
 * Get unknown faces log
 * GET /api/zones/1/unknown-list
 */
export const getUnknownFaces = async (req, res) => {
  try {
    const { limit = 20, status } = req.query;

    const whereClause = {
      Zone_id: 1
    };

    if (status) {
      whereClause.Status = status;
    }

    const unknownFaces = await prisma.unknownFaces.findMany({
      where: whereClause,
      orderBy: {
        DetectedTime: 'desc'
      },
      take: parseInt(limit)
    });

    // Convert images to base64
    const formatted = unknownFaces.map(face => ({
      Unknown_ID: face.Unknown_ID,
      CapturedImage: face.Captured_Image 
        ? `data:image/jpeg;base64,${face.Captured_Image.toString('base64')}`
        : null,
      DetectedTime: face.DetectedTime,
      Confidence: face.Confidence,
      Status: face.Status,
      Notes: face.Notes
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted
    });

  } catch (error) {
    console.error('Error fetching unknown faces:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unknown faces',
      error: error.message
    });
  }
};

/**
 * Update unknown face status
 * PUT /api/zones/1/unknown/:unknownId
 */
export const updateUnknownFaceStatus = async (req, res) => {
  try {
    const { unknownId } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    // Validate status
    const validStatuses = ['PENDING', 'IDENTIFIED', 'IGNORED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be PENDING, IDENTIFIED, or IGNORED'
      });
    }

    const updated = await prisma.unknownFaces.update({
      where: {
        Unknown_ID: parseInt(unknownId)
      },
      data: {
        Status: status,
        ...(notes && { Notes: notes })
      }
    });

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: {
        Unknown_ID: updated.Unknown_ID,
        Status: updated.Status,
        Notes: updated.Notes
      }
    });

  } catch (error) {
    console.error('Error updating unknown face status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message
    });
  }
};

/**
 * Delete unknown face entry
 * DELETE /api/zones/1/unknown/:unknownId
 */
export const deleteUnknownFace = async (req, res) => {
  try {
    const { unknownId } = req.params;

    await prisma.unknownFaces.delete({
      where: {
        Unknown_ID: parseInt(unknownId)
      }
    });

    res.status(200).json({
      success: true,
      message: 'Unknown face entry deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting unknown face:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete unknown face entry',
      error: error.message
    });
  }
};
