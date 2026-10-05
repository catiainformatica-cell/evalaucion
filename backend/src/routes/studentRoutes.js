import express from 'express';
import { getStudentSubjects, getSectionForEvaluation } from '../controllers/studentController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('estudiante', 'admin'));

router.get('/materias', getStudentSubjects);
router.get('/seccion/:seccionId/evaluar', getSectionForEvaluation);

export default router;
