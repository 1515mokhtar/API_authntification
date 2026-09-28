import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getFirestore } from '../config/firebase';

export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export async function getUser(req: Request, res: Response) {
  // À implémenter
  res.status(501).json({ message: 'Not implemented' });
} 