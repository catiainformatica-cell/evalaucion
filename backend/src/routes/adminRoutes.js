import express from 'express';
import multer from 'multer';
import { getAdminSummary, getAllSections } from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { previewImport, confirmImport } from '../controllers/importController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authenticate);
router.use(authorize('admin'));

router.get('/summary', getAdminSummary);
router.get('/secciones', getAllSections);

// PDF Import routes
router.post('/import/preview', upload.single('pdf'), previewImport);
router.post('/import/confirm', confirmImport);

export default router;
