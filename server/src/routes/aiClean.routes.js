import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  detectColumns,
  analyzeData,
  parseCommand,
  standardizeValues,
} from '../controllers/aiClean.controller.js';

const router = Router();

router.use(requireAuth);

router.post('/detect-columns', detectColumns);
router.post('/analyze', analyzeData);
router.post('/command', parseCommand);
router.post('/standardize', standardizeValues);

export default router;

