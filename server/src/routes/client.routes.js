import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createClientSchema, updateClientSchema } from '../schemas/client.schema.js';
import {
  listClients,
  createClient,
  getClient,
  updateClient,
  deleteClient,
} from '../controllers/client.controller.js';

const router = Router();

// All client routes require authentication
router.use(requireAuth);

router.get('/', listClients);
router.post('/', validate(createClientSchema), createClient);
router.get('/:id', getClient);
router.put('/:id', validate(updateClientSchema), updateClient);
router.delete('/:id', deleteClient);

export default router;

