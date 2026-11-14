import { z } from 'zod';

const condition = z.object({
  column: z.string(),
  op: z.enum([
    'equals',
    'not_equals',
    'contains',
    'starts_with',
    'ends_with',
    'is_empty',
    'not_empty',
    'gt',
    'lt',
  ]),
  value: z.union([z.string(), z.number()]).optional(),
});

const scope = z.enum(['sheet', 'selection', 'filtered']).default('sheet');

export const aiOperationSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('trim'), columns: z.array(z.string()) }),
  z.object({
    type: z.literal('change_case'),
    columns: z.array(z.string()),
    mode: z.enum(['lower', 'upper', 'title']),
  }),
  z.object({ type: z.literal('delete_rows'), where: z.array(condition) }),
  z.object({
    type: z.literal('replace_values'),
    column: z.string(),
    from: z.string(),
    to: z.string(),
    match: z.enum(['whole_cell', 'contains']).default('contains'),
    matchCase: z.boolean().default(false),
    scope,
  }),
  z.object({ type: z.literal('extract_domain'), column: z.string(), target: z.string() }),
  z.object({
    type: z.literal('remove_duplicates'),
    columns: z.array(z.string()),
    keep: z.enum(['first', 'last']),
  }),
  z.object({ type: z.literal('fill_empty'), column: z.string(), value: z.string() }),
  // needs understanding: the app sends the UNIQUE values, the AI returns old to new pairs
  z.object({
    type: z.literal('ai_rewrite'),
    columns: z.array(z.string()),
    instruction: z.string().max(500),
    scope,
  }),
  // creates a new column from other columns
  z.object({
    type: z.literal('ai_new_column'),
    name: z.string(),
    sourceColumns: z.array(z.string()),
    instruction: z.string().max(500),
  }),
]);

// Step 1: the AI plans the operations for a command
export const aiOperationsResponse = z.object({
  operations: z.array(aiOperationSchema).max(20),
});

// Step 2 (only for ai_rewrite and ai_new_column): one call per batch of unique values
export const aiValueMapResponse = z.object({
  mappings: z.array(z.object({ from: z.string(), to: z.string() })).max(200),
});

