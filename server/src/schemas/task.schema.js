import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Task title is required.').max(500),
  dueAt: z.string().min(1, 'Due date is required.'),
  prospect: z.string().optional().nullable(),
  type: z.enum(['follow_up', 'manual']).optional().default('manual'),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(500).optional(),
  dueAt: z.string().optional(),
  prospect: z.string().optional().nullable(),
  type: z.enum(['follow_up', 'manual']).optional(),
  isDone: z.boolean().optional(),
});

export const snoozeTaskSchema = z.object({
  days: z.number().int().positive().optional(),
  customDate: z.string().optional(),
});
