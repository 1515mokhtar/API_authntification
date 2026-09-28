import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', authController.register);
router.post('/signup', authController.signup); // New signup route
router.post('/login', authController.login);
router.get('/verify', authController.verifyToken);
router.post('/forgot-password', authController.forgotPassword);
router.get('/reset-password/:token', authController.validateResetToken); // optionnel
router.post('/reset-password', authController.resetPassword);
router.post('/logout', authenticateJWT, authController.logout);

// Google Authentication routes
router.post('/google/login', authController.googleLogin);
router.post('/google/callback', authController.googleCallback);

export default router; 