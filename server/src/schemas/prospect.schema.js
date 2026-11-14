import { z } from 'zod';
import { PROSPECT_STATUSES } from '../models/Prospect.js';

export const createProspectSchema = z.object({
  campaign: z.string().min(1, 'Campaign is required.'),
  domain: z.string().trim().min(1, 'Domain is required.'),
  pageUrl: z.string().trim().optional().default(''),
  contactName: z.string().trim().optional().default(''),
  contactEmail: z.string().trim().email('Invalid email address').or(z.literal('')).optional().default(''),
  niche: z.string().trim().optional().default(''),
  country: z.string().trim().optional().default(''),
  dr: z.coerce.number().min(0).max(100).optional().default(0),
  traffic: z.coerce.number().min(0).optional().default(0),
  tags: z.array(z.string().trim()).optional().default([]),
  notes: z.string().trim().optional().default(''),
  status: z.enum(PROSPECT_STATUSES).optional().default('new'),
});

export const updateProspectSchema = z.object({
  campaign: z.string().min(1).optional(),
  domain: z.string().trim().min(1).optional(),
  pageUrl: z.string().trim().optional(),
  contactName: z.string().trim().optional(),
  contactEmail: z.string().trim().email('Invalid email address').or(z.literal('')).optional(),
  niche: z.string().trim().optional(),
  country: z.string().trim().optional(),
  dr: z.coerce.number().min(0).max(100).optional(),
  traffic: z.coerce.number().min(0).optional(),
  tags: z.array(z.string().trim()).optional(),
  notes: z.string().trim().optional(),
  status: z.enum(PROSPECT_STATUSES).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(PROSPECT_STATUSES),
});

export const bulkActionSchema = z.object({
  action: z.enum(['status', 'tag', 'delete']),
  ids: z.array(z.string().min(1)).min(1, 'At least one prospect must be selected.'),
  status: z.enum(PROSPECT_STATUSES).optional(),
  tag: z.string().trim().optional(),
});

