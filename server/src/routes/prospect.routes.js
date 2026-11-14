import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createProspectSchema,
  updateProspectSchema,
  updateStatusSchema,
  bulkActionSchema,
} from '../schemas/prospect.schema.js';
import {
  listProspects,
  createProspect,
  getProspect,
  updateProspect,
  updateStatus,
  deleteProspect,
  bulkAction,
  importCSV,
} from '../controllers/prospect.controller.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.endsWith('.csv')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only .csv files are allowed.'));
    }
  },
});

router.use(requireAuth);

router.get('/', listProspects);
router.post('/', validate(createProspectSchema), createProspect);
router.post('/bulk', validate(bulkActionSchema), bulkAction);
router.post('/import', upload.single('file'), importCSV);

router.get('/:id', getProspect);
router.put('/:id', validate(updateProspectSchema), updateProspect);
router.patch('/:id/status', validate(updateStatusSchema), updateStatus);
router.delete('/:id', deleteProspect);

export default router;

