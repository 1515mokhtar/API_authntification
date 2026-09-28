import { Request, Response, NextFunction } from 'express';

export function validateBody(validator: (body: any) => { value?: any; error?: any }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = validator(req.body);
    if (error) {
      return res.status(400).json({ message: error.details?.[0]?.message || 'Invalid request body' });
    }
    next();
  };
} 