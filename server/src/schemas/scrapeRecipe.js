import { z } from 'zod';

export const recipeSchema = z.object({
  rowSelector: z.string().min(1).max(200),
  fields: z
    .array(
      z.object({
        name: z.string().min(1).max(60),
        selector: z.string().max(200).default(''), // relative to row; empty means row itself
        attr: z.string().nullish().transform((val) => {
          if (!val) return 'text';
          const lower = String(val).toLowerCase().trim();
          if (['href', 'src', 'content', 'title', 'alt'].includes(lower)) return lower;
          return 'text';
        }),
      })
    )
    .min(1)
    .max(30),
  nextPageSelector: z.string().max(200).nullable().optional(),
});

// Fallback: rows read straight from page text by the AI
export const aiRowsResponse = z.object({
  rows: z.array(z.record(z.string(), z.string().nullable())).max(500),
});
