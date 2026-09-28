import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';

export function createRateLimiter(points: number, duration: number, blockDuration: number) {
  const limiter = new RateLimiterMemory({
    points,
    duration,
    blockDuration,
  });
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await limiter.consume(req.ip);
      next();
    } catch {
      res.status(429).json({ message: 'Too many requests' });
    }
  };
} 