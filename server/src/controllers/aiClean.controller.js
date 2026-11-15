import { aiOperationsResponse, aiValueMapResponse } from '../schemas/aiClean.js';
import normalizeDomain from '../utils/normalizeDomain.js';
import { planOperationsWithGemini, standardizeWithGemini } from '../services/gemini.service.js';

// POST /api/v1/ai/clean/detect-columns
export const detectColumns = async (req, res, next) => {
  try {
    const { columns = [] } = req.body;
    const mapping = {};

    columns.forEach((col) => {
      const name = (col.name || '').toLowerCase().trim();
      if (!mapping.domain && (name.includes('domain') || name.includes('website') || name.includes('site') || name.includes('url'))) {
        if (!name.includes('page') && !name.includes('article') && !name.includes('post')) {
          mapping.domain = col.id;
        }
      }
      if (!mapping.page_url && (name.includes('page') || name.includes('target') || name.includes('article') || name.includes('post_url'))) {
        mapping.page_url = col.id;
      }
      if (!mapping.contact_email && (name.includes('email') || name.includes('mail') || name.includes('e-mail'))) {
        mapping.contact_email = col.id;
      }
      if (!mapping.contact_name && (name.includes('name') || name.includes('contact') || name.includes('author') || name.includes('editor'))) {
        if (!name.includes('company') && !name.includes('site')) {
          mapping.contact_name = col.id;
        }
      }
      if (!mapping.niche && (name.includes('niche') || name.includes('category') || name.includes('topic') || name.includes('industry'))) {
        mapping.niche = col.id;
      }
      if (!mapping.country && (name.includes('country') || name.includes('location') || name.includes('geo') || name.includes('region'))) {
        mapping.country = col.id;
      }
      if (!mapping.dr && (name.includes('dr') || name.includes('domain_rating') || name.includes('da') || name.includes('authority'))) {
        mapping.dr = col.id;
      }
      if (!mapping.traffic && (name.includes('traffic') || name.includes('visits') || name.includes('organic'))) {
        mapping.traffic = col.id;
      }
      if (!mapping.tags && (name.includes('tag') || name.includes('label') || name.includes('segment'))) {
        mapping.tags = col.id;
      }
      if (!mapping.notes && (name.includes('note') || name.includes('comment') || name.includes('desc'))) {
        mapping.notes = col.id;
      }
    });

    res.json({ success: true, data: { mapping } });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/ai/clean/analyze
export const analyzeData = async (req, res, next) => {
  try {
    const { columns = [], sampleRows = [] } = req.body;
    const suggestions = [];

    // Check for email column with empty/invalid values
    const emailCol = columns.find((c) => /email|mail/i.test(c.name));
    if (emailCol) {
      let emptyCount = 0;
      sampleRows.forEach((r) => {
        const val = r.cells?.[emailCol.id];
        if (!val || !val.trim()) emptyCount++;
      });
      if (emptyCount > 0) {
        suggestions.push({
          id: 'sug_empty_email',
          type: 'delete_rows',
          title: `Empty Emails Detected in "${emailCol.name}"`,
          description: `Found empty or missing emails in several rows. Remove rows without contact emails?`,
          action: {
            type: 'delete_rows',
            where: [{ column: emailCol.id, op: 'is_empty' }],
          },
        });
      }
    }

    // Check for unnormalized domain/URL column
    const urlCol = columns.find((c) => /domain|website|url/i.test(c.name));
    if (urlCol) {
      let needsExtract = false;
      sampleRows.forEach((r) => {
        const val = r.cells?.[urlCol.id];
        if (val && (val.includes('http://') || val.includes('https://') || val.includes('www.') || val.includes('/'))) {
          needsExtract = true;
        }
      });
      if (needsExtract) {
        suggestions.push({
          id: 'sug_extract_domain',
          type: 'extract_domain',
          title: `Extract Clean Domains in "${urlCol.name}"`,
          description: `Raw URLs contain protocols, "www", and paths. Strip to clean root domains?`,
          action: {
            type: 'extract_domain',
            column: urlCol.id,
            target: urlCol.id,
          },
        });
      }
    }

    // Check for duplicate domains
    if (urlCol) {
      const seen = new Set();
      let dups = 0;
      sampleRows.forEach((r) => {
        const val = normalizeDomain(r.cells?.[urlCol.id]);
        if (val) {
          if (seen.has(val)) dups++;
          else seen.add(val);
        }
      });
      if (dups > 0) {
        suggestions.push({
          id: 'sug_remove_duplicates',
          type: 'remove_duplicates',
          title: `Duplicate Domains Found in "${urlCol.name}"`,
          description: `Found ${dups} duplicate entries. Automatically deduplicate and keep first row?`,
          action: {
            type: 'remove_duplicates',
            columns: [urlCol.id],
            keep: 'first',
          },
        });
      }
    }

    // Whitespace / casing suggestion
    suggestions.push({
      id: 'sug_trim',
      type: 'trim',
      title: 'Trim All Whitespace',
      description: 'Clean up leading and trailing spaces across all text columns.',
      action: {
        type: 'trim',
        columns: columns.map((c) => c.id),
      },
    });

    res.json({ success: true, data: { suggestions } });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/ai/clean/command
export const parseRuleIntent = (command, columns = [], selectedColumnId = null) => {
  const cmd = command.toLowerCase().trim();

  // Find if an explicit column is mentioned
  let explicitColId = null;
  for (const c of columns) {
    const rawName = c.name.toLowerCase();
    const strippedName = rawName.replace(/\s*\(.*?\)\s*/g, '').trim();
    if (cmd.includes(rawName) || (strippedName.length > 2 && cmd.includes(strippedName)) || cmd.includes(c.id.toLowerCase())) {
      explicitColId = c.id;
      break;
    }
  }

  const domainCol = columns.find((c) => /domain|website|url|site/i.test(c.name))?.id || columns[0]?.id;
  const emailCol = columns.find((c) => /email|mail/i.test(c.name))?.id;

  // 1. TRIM SPACES / WHITESPACE
  if (
    cmd === 'trim' ||
    cmd.startsWith('trim ') ||
    cmd.includes('trim space') ||
    cmd.includes('trim whitespace') ||
    cmd.includes('remove whitespace') ||
    cmd === 'trim all'
  ) {
    const targetCols = explicitColId ? [explicitColId] : columns.map((c) => c.id);
    return {
      explanation: explicitColId
        ? `Trim whitespace in column "${columns.find((c) => c.id === explicitColId)?.name}"`
        : 'Trim whitespace across all columns',
      operations: [{ type: 'trim', columns: targetCols }],
    };
  }

  // 2. CASE CHANGE (lowercase, uppercase, titlecase)
  // MUST be checked BEFORE replace_values so "change domain to lowercase" or "change to lowercase" isn't treated as string replace
  if (
    cmd.includes('lowercase') ||
    cmd.includes('lower case') ||
    cmd.includes('uppercase') ||
    cmd.includes('upper case') ||
    cmd.includes('titlecase') ||
    cmd.includes('title case') ||
    cmd === 'change case' ||
    cmd === 'change' ||
    cmd === 'change case to lower' ||
    cmd === 'change case to upper'
  ) {
    const mode =
      cmd.includes('upper') || cmd.includes('uppercase')
        ? 'upper'
        : cmd.includes('title') || cmd.includes('titlecase') || cmd.includes('capitalize')
        ? 'title'
        : 'lower';
    const targetCols = explicitColId
      ? [explicitColId]
      : selectedColumnId
      ? [selectedColumnId]
      : columns.map((c) => c.id);
    return {
      explanation: `Change case to ${mode} on target column(s)`,
      operations: [{ type: 'change_case', columns: targetCols, mode }],
    };
  }

  // 3. REMOVE / DEDUPLICATE
  if (
    cmd === 'remove' ||
    cmd === 'deduplicate' ||
    cmd === 'dedup' ||
    cmd === 'remove duplicates' ||
    cmd === 'remove duplicate' ||
    cmd === 'remove duplicate rows' ||
    cmd.includes('dedup') ||
    (cmd.includes('duplicate') && !cmd.includes('where'))
  ) {
    const targetCol = explicitColId || selectedColumnId || domainCol || columns[0]?.id;
    return {
      explanation: `Remove duplicate rows based on unique column (${
        columns.find((c) => c.id === targetCol)?.name || 'Domain'
      })`,
      operations: [{ type: 'remove_duplicates', columns: [targetCol], keep: 'first' }],
    };
  }

  // 4. REMOVE / DELETE EMPTY ROWS
  if (
    cmd === 'remove empty' ||
    cmd === 'delete empty' ||
    cmd.includes('empty rows') ||
    cmd.includes('blank rows') ||
    cmd === 'delete empty rows' ||
    cmd === 'remove empty rows' ||
    cmd.includes('no email') ||
    cmd.includes('without email') ||
    ((cmd.includes('remove') || cmd.includes('delete')) && (cmd.includes('empty') || cmd.includes('blank')))
  ) {
    if (!cmd.includes('all value') && !cmd.includes('all values')) {
      const targetCol =
        explicitColId || (cmd.includes('email') ? emailCol : selectedColumnId) || domainCol || columns[0]?.id;
      return {
        explanation: `Remove rows where "${
          columns.find((c) => c.id === targetCol)?.name || 'active column'
        }" is empty`,
        operations: [{ type: 'delete_rows', where: [{ column: targetCol, op: 'is_empty' }] }],
      };
    }
  }

  // 5. CLEAR / EMPTY COLUMN VALUES (e.g. "delete all value from price", "clear price", "empty price column")
  if (
    (cmd.includes('delete all value') || cmd.includes('delete all values') || cmd.includes('clear') || cmd.includes('empty')) &&
    !cmd.includes('row') &&
    !cmd.includes('rows')
  ) {
    const targetCol = explicitColId || selectedColumnId || columns[0]?.id;
    return {
      explanation: `Clear all values in column "${columns.find((c) => c.id === targetCol)?.name || ''}"`,
      operations: [{ type: 'clear_column', columns: [targetCol] }],
    };
  }

  // 6. FORMAT PATTERN: REMOVE SYMBOLS / CURRENCY / $ FROM PRICE
  if (
    cmd.includes('$') ||
    cmd.includes('dollar') ||
    cmd.includes('currency') ||
    (cmd.includes('symbol') && (cmd.includes('remove') || cmd.includes('clean')))
  ) {
    const targetCol =
      explicitColId ||
      selectedColumnId ||
      columns.find((c) => /price|cost|usd/i.test(c.name))?.id ||
      columns[0]?.id;
    return {
      explanation: `Remove currency symbols ($) and format numbers in "${
        columns.find((c) => c.id === targetCol)?.name || ''
      }"`,
      operations: [{ type: 'format_pattern', columns: [targetCol], pattern: 'clean_number' }],
    };
  }

  // 7. DELETE COLUMN (e.g. "delete column price", "remove price", "remove column status")
  if (
    (cmd.includes('delete column') ||
      cmd.includes('remove column') ||
      cmd.includes('drop column') ||
      (explicitColId && (cmd.startsWith('remove ') || cmd.startsWith('delete ')))) &&
    !cmd.includes('row') &&
    !cmd.includes('rows') &&
    !cmd.includes('from')
  ) {
    const targetCol = explicitColId || selectedColumnId || columns[0]?.id;
    return {
      explanation: `Delete column "${columns.find((c) => c.id === targetCol)?.name || ''}"`,
      operations: [{ type: 'delete_column', columns: [targetCol] }],
    };
  }

  // 8. EXTRACT DOMAIN
  if (
    cmd.includes('extract domain') ||
    cmd.includes('clean domain') ||
    cmd.includes('clean url') ||
    cmd.includes('normalize domain')
  ) {
    const targetCol = explicitColId || selectedColumnId || domainCol || columns[0]?.id;
    return {
      explanation: `Extract clean domains in "${columns.find((c) => c.id === targetCol)?.name || ''}"`,
      operations: [{ type: 'extract_domain', column: targetCol, target: targetCol }],
    };
  }

  // 9. REPLACE / CHANGE VALUE (e.g. "change MD to Managing Director" or "replace X with Y")
  const replaceMatch = command.match(
    /(?:change|replace|convert)\s+(?:all\s+)?["']?([^"']+)["']?\s+(?:to|with|into)\s+["']?([^"']+)["']?/i
  );
  if (replaceMatch) {
    const from = replaceMatch[1].trim();
    const to = replaceMatch[2].trim();
    if (!/^(?:lower|lowercase|upper|uppercase|title|titlecase)$/i.test(to)) {
      const targetCol = explicitColId || selectedColumnId || columns[0]?.id;
      return {
        explanation: `Replace "${from}" with "${to}" in "${
          columns.find((c) => c.id === targetCol)?.name || 'active column'
        }"`,
        operations: [
          {
            type: 'replace_values',
            column: targetCol,
            from,
            to,
            match: 'contains',
            matchCase: false,
            scope: 'sheet',
          },
        ],
      };
    }
  }

  return null;
};

// POST /api/v1/ai/clean/command
export const parseCommand = async (req, res, next) => {
  try {
    const { command, columns = [], sampleRows = [], selectedColumnId } = req.body;
    if (!command || !command.trim()) {
      return res.status(400).json({ success: false, message: 'Command is required.' });
    }

    // 1. High-confidence fast rule intent engine (0ms response, 100% deterministic)
    const ruleResult = parseRuleIntent(command.trim(), columns, selectedColumnId);
    if (ruleResult && ruleResult.operations && ruleResult.operations.length > 0) {
      const validated = aiOperationsResponse.parse(ruleResult);
      return res.json({ success: true, data: validated, source: 'fast-rule' });
    }

    // 2. Try Gemini Live LLM for complex / natural language prompts
    const geminiPlan = await planOperationsWithGemini({
      command: command.trim(),
      columns,
      sampleRows,
      selectedColumnId,
      workspaceId: req.workspaceId,
      userId: req.user?._id,
    });

    if (geminiPlan && geminiPlan.operations && geminiPlan.operations.length > 0) {
      return res.json({ success: true, data: geminiPlan, source: 'gemini' });
    }

    // 3. Fallback: If no direct rule or Gemini match, return general semantic rewrite
    const targetCol = selectedColumnId || columns[0]?.id;
    const fallbackPlan = aiOperationsResponse.parse({
      explanation: `Execute AI instruction on sheet`,
      operations: [
        {
          type: 'ai_rewrite',
          columns: targetCol ? [targetCol] : [],
          instruction: command.trim(),
          scope: 'sheet',
        },
      ],
    });
    res.json({ success: true, data: fallbackPlan, source: 'fallback' });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/ai/clean/standardize
export const standardizeValues = async (req, res, next) => {
  try {
    const { values = [], instruction = 'Standardize values' } = req.body;

    // 1. Try Gemini Live LLM first
    const geminiMappings = await standardizeWithGemini({
      values,
      instruction,
      workspaceId: req.workspaceId,
      userId: req.user?._id,
    });

    if (geminiMappings && geminiMappings.mappings) {
      return res.json({ success: true, data: geminiMappings, source: 'gemini' });
    }

    // 2. Fallback to smart standardizations
    const mappings = [];

    values.forEach((v) => {
      const str = String(v).trim();
      let clean = str;

      // Smart standardizations
      if (/^united kingdom$|^uk$|^u\.k\.$|^britain$|^great britain$/i.test(str)) {
        clean = 'United Kingdom';
      } else if (/^united states$|^usa$|^u\.s\.a\.$|^us$|^u\.s\.$/i.test(str)) {
        clean = 'United States';
      } else if (/managing director/i.test(str)) {
        clean = str.replace(/managing director/gi, 'MD');
      } else if (/chief executive officer/i.test(str)) {
        clean = str.replace(/chief executive officer/gi, 'CEO');
      } else if (/vice president/i.test(str)) {
        clean = str.replace(/vice president/gi, 'VP');
      }

      if (clean !== str) {
        mappings.push({ from: str, to: clean });
      }
    });

    res.json({ success: true, data: { mappings } });
  } catch (err) {
    next(err);
  }
};

