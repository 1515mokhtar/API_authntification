"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = validateBody;
function validateBody(validator) {
    return (req, res, next) => {
        const { error } = validator(req.body);
        if (error) {
            return res.status(400).json({ message: error.details?.[0]?.message || 'Invalid request body' });
        }
        next();
    };
}
