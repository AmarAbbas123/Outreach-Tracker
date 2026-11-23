import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createCampaignSchema, updateCampaignSchema } from '../schemas/campaign.schema.js';
import {
  listCampaigns,
  createCampaign,
  getCampaign,
  getCampaignStats,
  updateCampaign,
  deleteCampaign,
  getCampaignLinks,
  createCampaignLink,
} from '../controllers/campaign.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', listCampaigns);
router.post('/', validate(createCampaignSchema), createCampaign);
router.get('/:id', getCampaign);
router.get('/:id/stats', getCampaignStats);
router.get('/:id/links', getCampaignLinks);
router.post('/:id/links', createCampaignLink);
router.put('/:id', validate(updateCampaignSchema), updateCampaign);
router.delete('/:id', deleteCampaign);

export default router;
