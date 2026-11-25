import { Router } from 'express';
import authRoutes from './auth.routes.js';
import clientRoutes from './client.routes.js';
import campaignRoutes from './campaign.routes.js';
import prospectRoutes from './prospect.routes.js';
import datasetRoutes from './dataset.routes.js';
import aiCleanRoutes from './aiClean.routes.js';
import scraperRoutes from './scraper.routes.js';
import templateRoutes from './template.routes.js';
import taskRoutes from './task.routes.js';
import reportRoutes from './report.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/clients', clientRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/prospects', prospectRoutes);
router.use('/datasets', datasetRoutes);
router.use('/ai/clean', aiCleanRoutes);
router.use('/scrape', scraperRoutes);
router.use('/templates', templateRoutes);
router.use('/tasks', taskRoutes);
router.use('/reports', reportRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

export default router;

