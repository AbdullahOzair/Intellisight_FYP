import { z } from 'zod';

export const createCameraSchema = z.object({
  body: z.object({
    Password: z.string().min(4, 'Password must be at least 4 characters').max(255),
    Zone_id: z.number().int().positive().optional(),
  }),
});

export const updateCameraSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
  }),
  body: z.object({
    Password: z.string().min(4).max(255).optional(),
    Zone_id: z.number().int().positive().nullable().optional(),
  }),
});

export const getCameraSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
  }),
});

export const deleteCameraSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
  }),
});
