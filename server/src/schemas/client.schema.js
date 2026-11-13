import { z } from 'zod';

export const createClientSchema = z.object({
  name: z.string().trim().min(1, 'Client name is required.').max(200),
  domain: z.string().trim().max(255).optional().default(''),
  niche: z.string().trim().max(100).optional().default(''),
  notes: z.string().trim().max(2000).optional().default(''),
});

export const updateClientSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  domain: z.string().trim().max(255).optional(),
  niche: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(2000).optional(),
  isArchived: z.boolean().optional(),
});

