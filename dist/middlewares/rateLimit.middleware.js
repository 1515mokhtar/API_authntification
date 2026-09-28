"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRateLimiter = createRateLimiter;
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
function createRateLimiter(points, duration, blockDuration) {
    const limiter = new rate_limiter_flexible_1.RateLimiterMemory({
        points,
        duration,
        blockDuration,
    });
    return async (req, res, next) => {
        try {
            await limiter.consume(req.ip);
            next();
        }
        catch {
            res.status(429).json({ message: 'Too many requests' });
        }
    };
}
