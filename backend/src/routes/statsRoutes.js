import express from 'express';
import { getStats, getFilterOptions } from '../controllers/statsController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin', 'docente'));

router.get('/filtros', getFilterOptions);
router.get('/', getStats);

export default router;
