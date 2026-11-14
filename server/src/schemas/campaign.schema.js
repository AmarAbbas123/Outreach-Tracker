import { z } from 'zod';

export const createCampaignSchema = z.object({
  client: z.string().optional(),
  name: z.string().trim().min(1, 'Campaign name is required.').max(200),
  type: z
    .enum(['guest_post', 'broken_link', 'resource_page', 'link_insertion', 'digital_pr', 'other'])
    .optional()
    .default('guest_post'),
  targetUrls: z.array(z.string().trim()).optional().default([]),
  goalLinks: z.number().min(0).optional().default(0),
  budget: z.number().min(0).optional().default(0),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  status: z.enum(['draft', 'active', 'paused', 'completed']).optional().default('active'),
});

export const updateCampaignSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  type: z
    .enum(['guest_post', 'broken_link', 'resource_page', 'link_insertion', 'digital_pr', 'other'])
    .optional(),
  targetUrls: z.array(z.string().trim()).optional(),
  goalLinks: z.number().min(0).optional(),
  budget: z.number().min(0).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  status: z.enum(['draft', 'active', 'paused', 'completed']).optional(),
});
