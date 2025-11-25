import { z } from 'zod';

// Base64 image validator
const base64ImageValidator = z.string()
  .regex(/^data:image\/(png|jpeg|jpg|gif|webp);base64,/, 'Must be a valid base64 image')
  .optional();

export const createStudentSchema = z.object({
  body: z.object({
    Name: z.string().min(2, 'Name must be at least 2 characters').max(255),
    Email: z.string().email('Invalid email address').max(255).optional(),
    Face_Pictures: z.array(
      z.string().regex(/^data:image\/(png|jpeg|jpg|gif|webp);base64,/, 'Must be a valid base64 image')
    ).min(1, 'At least 1 face picture is required').max(5, 'Maximum 5 face pictures allowed'),
    Camara_Id: z.number().int().positive().optional(),
    Zone_id: z.number().int().positive().optional(),
  }),
});

export const updateStudentSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
  }),
  body: z.object({
    Name: z.string().min(2).max(255).optional(),
    Email: z.string().email().max(255).optional(),
    Face_Pictures: base64ImageValidator,
    Camara_Id: z.number().int().positive().nullable().optional(),
    Zone_id: z.number().int().positive().nullable().optional(),
  }),
});

export const getStudentSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
  }),
});

export const deleteStudentSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
  }),
});

export const uploadFacePictureSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
  }),
  body: z.object({
    Face_Pictures: z.string().regex(/^data:image\/(png|jpeg|jpg|gif|webp);base64,/, 'Must be a valid base64 image'),
  }),
});
