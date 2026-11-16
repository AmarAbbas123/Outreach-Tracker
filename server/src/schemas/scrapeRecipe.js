import { z } from 'zod';

export const recipeSchema = z.object({
  rowSelector: z.string().min(1).max(200),
  fields: z
    .array(
      z.object({
        name: z.string().min(1).max(40),
        selector: z.string().max(200).default(''), // relative to row; empty means row itself
        attr: z.enum(['text', 'href', 'src', 'content']).default('text'),
      })
    )
    .min(1)
    .max(20),
  nextPageSelector: z.string().max(200).optional(),
});

// Fallback: rows read straight from page text by the AI
export const aiRowsResponse = z.object({
  rows: z.array(z.record(z.string(), z.string().nullable())).max(500),
});
