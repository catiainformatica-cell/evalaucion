import express from 'express';
import { submitEvaluation } from '../controllers/evaluationController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('estudiante', 'admin'));

router.post('/submit', submitEvaluation);

export default router;
