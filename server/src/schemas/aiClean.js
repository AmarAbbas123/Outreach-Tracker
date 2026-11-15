import { z } from 'zod';

const condition = z.object({
  column: z.string(),
  op: z.enum([
    'equals',
    'not_equals',
    'contains',
    'does_not_contain',
    'starts_with',
    'ends_with',
    'is_empty',
    'not_empty',
    'gt',
    'lt',
    'gte',
    'lte',
    'greater_than',
    'less_than',
    'greater_than_or_equal',
    'less_than_or_equal',
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
    scope: scope.optional().default('sheet'),
  }),
  z.object({ type: z.literal('extract_domain'), column: z.string(), target: z.string().optional() }),
  z.object({
    type: z.literal('remove_duplicates'),
    columns: z.array(z.string()),
    keep: z.enum(['first', 'last']).default('first'),
  }),
  z.object({ type: z.literal('fill_empty'), column: z.string(), value: z.string() }),
  // Clears all cell values in column(s) to blank ""
  z.object({
    type: z.literal('clear_column'),
    columns: z.array(z.string()).optional(),
    column: z.string().optional(),
  }),
  // Deletes column(s) completely from the dataset
  z.object({
    type: z.literal('delete_column'),
    columns: z.array(z.string()).optional(),
    column: z.string().optional(),
  }),
  // needs understanding: the app sends the UNIQUE values, the AI returns old to new pairs
  z.object({
    type: z.literal('ai_rewrite'),
    columns: z.array(z.string()),
    instruction: z.string().max(1000),
    scope: scope.optional().default('sheet'),
  }),
  // creates a new column from other columns
  z.object({
    type: z.literal('ai_new_column'),
    name: z.string(),
    sourceColumns: z.array(z.string()).optional().default([]),
    instruction: z.string().max(1000),
  }),
]);

// Step 1: the AI plans the operations for a command
export const aiOperationsResponse = z.object({
  explanation: z.string().optional(),
  operations: z.array(aiOperationSchema).max(20),
});

// Step 2 (only for ai_rewrite and ai_new_column): one call per batch of unique values
export const aiValueMapResponse = z.object({
  mappings: z.array(z.object({ from: z.string(), to: z.string() })).max(200),
});

