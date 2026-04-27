import { validationResult } from 'express-validator';
import type { Request, Response, NextFunction } from 'express';

export function handleValidationErrors(req: Request, res: Response, next: NextFunction): void {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    res.status(400).json({
      error: 'Validation failed',
      details: result.array().map((issue) => ({
        field: issue.type === 'field' ? issue.path : 'unknown',
        message: issue.msg,
      })),
    });
    return;
  }

  next();
}
