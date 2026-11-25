import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getReportData, exportReportCsv } from '../controllers/report.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', getReportData);
router.get('/export', exportReportCsv);

export default router;
