import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import {
  uploadDataset,
  listDatasets,
  getDataset,
  getDatasetRows,
  updateDatasetRows,
  updateDatasetColumns,
  resetDataset,
  duplicateDataset,
  exportDataset,
  sendToOutreach,
  deleteDataset,
} from '../controllers/dataset.controller.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB limit as per spec
});

router.use(requireAuth);

router.post('/upload', upload.single('file'), uploadDataset);
router.get('/', listDatasets);
router.get('/:id', getDataset);
router.get('/:id/rows', getDatasetRows);
router.patch('/:id/rows', updateDatasetRows);
router.patch('/:id/columns', updateDatasetColumns);
router.post('/:id/reset', resetDataset);
router.post('/:id/duplicate', duplicateDataset);
router.get('/:id/export', exportDataset);
router.post('/:id/send-to-outreach', sendToOutreach);
router.delete('/:id', deleteDataset);

export default router;
