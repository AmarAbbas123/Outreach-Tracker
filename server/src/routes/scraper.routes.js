import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  previewSite,
  analyzeUrl,
  describeRecipe,
  createJob,
  getJobs,
  getJobById,
  getJobEvents,
  cancelJob,
  retryFailedTasks,
  deleteJob,
  getRecipes,
  saveRecipe,
  deleteRecipe,
} from '../controllers/scraper.controller.js';

const router = Router();

router.use(requireAuth);

router.post('/preview', previewSite);
router.post('/analyze', analyzeUrl);
router.post('/describe', describeRecipe);

router.post('/jobs', createJob);
router.get('/jobs', getJobs);
router.get('/jobs/:id', getJobById);
router.get('/jobs/:id/events', getJobEvents);
router.post('/jobs/:id/cancel', cancelJob);
router.post('/jobs/:id/retry-failed', retryFailedTasks);
router.delete('/jobs/:id', deleteJob);

router.get('/recipes', getRecipes);
router.post('/recipes', saveRecipe);
router.delete('/recipes/:id', deleteRecipe);

export default router;
