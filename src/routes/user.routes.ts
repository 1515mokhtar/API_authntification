import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

router.get('/:id', authenticateJWT, userController.getUser);
router.put('/:id', authenticateJWT, userController.updateUser);
router.delete('/:id', authenticateJWT, userController.deleteUser);
router.get('/:id/connections', authenticateJWT, userController.getUserConnections);

export default router; 