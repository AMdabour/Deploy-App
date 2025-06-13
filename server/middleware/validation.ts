import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { preprocessUpdateData } from 'server/storage';

export function validateDateUpdate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    req.body = preprocessUpdateData(req.body);
    next();
  }
}

export function validateRequest(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors,
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };
}
