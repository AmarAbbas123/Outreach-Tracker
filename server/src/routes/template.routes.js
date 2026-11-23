import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createTemplateSchema,
  updateTemplateSchema,
  previewTemplateSchema,
} from '../schemas/template.schema.js';
import {
  listTemplates,
  createTemplate,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  previewTemplate,
} from '../controllers/template.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', listTemplates);
router.post('/', validate(createTemplateSchema), createTemplate);
router.get('/:id', getTemplate);
router.put('/:id', validate(updateTemplateSchema), updateTemplate);
router.delete('/:id', deleteTemplate);
router.post('/:id/duplicate', duplicateTemplate);
router.post('/:id/preview', validate(previewTemplateSchema), previewTemplate);

export default router;
