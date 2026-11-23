import { z } from 'zod';

export const createTemplateSchema = z.object({
  name: z.string().trim().min(1, 'Template name is required.').max(200),
  campaignType: z
    .enum(['guest_post', 'broken_link', 'resource_page', 'link_insertion', 'digital_pr', 'other', 'general'])
    .optional()
    .default('guest_post'),
  subject: z.string().trim().min(1, 'Subject line is required.').max(500),
  body: z.string().min(1, 'Email body is required.').max(20000),
});

export const updateTemplateSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  campaignType: z
    .enum(['guest_post', 'broken_link', 'resource_page', 'link_insertion', 'digital_pr', 'other', 'general'])
    .optional(),
  subject: z.string().trim().min(1).max(500).optional(),
  body: z.string().min(1).max(20000).optional(),
});

export const previewTemplateSchema = z.object({
  prospectId: z.string().optional(),
  customVars: z.record(z.string(), z.any()).optional(),
});
