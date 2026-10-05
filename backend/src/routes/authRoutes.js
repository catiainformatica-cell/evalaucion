import express from 'express';
import { login, me, demoLogin } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', authenticate, me);
router.get('/demo/:role', demoLogin);

export default router;
