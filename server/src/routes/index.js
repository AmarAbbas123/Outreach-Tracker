import { Router } from 'express';
import authRoutes from './auth.routes.js';
import clientRoutes from './client.routes.js';
import campaignRoutes from './campaign.routes.js';
import prospectRoutes from './prospect.routes.js';
import datasetRoutes from './dataset.routes.js';
import aiCleanRoutes from './aiClean.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/clients', clientRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/prospects', prospectRoutes);
router.use('/datasets', datasetRoutes);
router.use('/ai/clean', aiCleanRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

export default router;

