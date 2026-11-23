import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createTaskSchema,
  updateTaskSchema,
  snoozeTaskSchema,
} from '../schemas/task.schema.js';
import {
  listTasks,
  getTaskCounts,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  completeTask,
  snoozeTask,
} from '../controllers/task.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', listTasks);
router.get('/counts', getTaskCounts);
router.post('/', validate(createTaskSchema), createTask);
router.get('/:id', getTask);
router.put('/:id', validate(updateTaskSchema), updateTask);
router.delete('/:id', deleteTask);
router.patch('/:id/complete', completeTask);
router.patch('/:id/snooze', validate(snoozeTaskSchema), snoozeTask);

export default router;
