import { Router } from 'express';
import authRoutes from './auth.routes.js';

const router = Router();

router.use('/auth', authRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

export default router;
