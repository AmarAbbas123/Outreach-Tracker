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

// Helper to resolve column name/part to exact col.id
export const resolveCol = (nameOrPart, cols) => {
  if (!nameOrPart) return null;
  const clean = String(nameOrPart).toLowerCase().trim();
  let m = cols.find((c) => c.id.toLowerCase() === clean || c.name.toLowerCase() === clean);
  if (m) return m.id;
  m = cols.find((c) => c.name.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim() === clean);
  if (m) return m.id;
  m = cols.find(
    (c) =>
      c.name.toLowerCase().includes(clean) ||
      clean.includes(c.name.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim())
  );
  return m ? m.id : clean;
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

  // 0. COPY COLUMN (e.g. "copy domain to website", "copy price to new_price", "copy category data to column 6")
  const copyMatch = command.match(
    /copy\s+(?:data\s+from\s+|column\s+)?([a-zA-Z0-9_ ()]+?)\s+(?:data\s+)?to\s+(?:column\s+)?([a-zA-Z0-9_ ()]+)/i
  );
  if (copyMatch && !cmd.includes('this colum')) {
    const from = resolveCol(copyMatch[1], columns);
    const to = resolveCol(copyMatch[2], columns);
    if (from && to) {
      return {
        explanation: `Copy data from column "${columns.find((c) => c.id === from)?.name || from}" to "${
          columns.find((c) => c.id === to)?.name || to
        }"`,
        operations: [{ type: 'copy_column', fromColumn: from, toColumn: to, createIfMissing: true }],
      };
    }
  }

  // 0b. SET COLUMN VALUE (e.g. "set price to 0", "set all status to active", "set category to Guest Post")
  const setMatch = command.match(/^set\s+(?:all\s+)?([a-zA-Z0-9_ ()]+?)\s+(?:values?\s+)?to\s+(.+)$/i);
  if (setMatch) {
    const col = resolveCol(setMatch[1], columns);
    let val = setMatch[2].trim().replace(/^["']|["']$/g, '');
    if (val.toLowerCase() === 'empty' || val.toLowerCase() === 'blank') val = '';
    if (col && !/^(?:lower|lowercase|upper|uppercase|title)$/i.test(val)) {
      return {
        explanation: `Set all values in column "${columns.find((c) => c.id === col)?.name || col}" to "${val}"`,
        operations: [{ type: 'set_column_value', column: col, value: val, where: [] }],
      };
    }
  }

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

  // 9. MERGE / COMBINE COLUMNS (e.g. "merge first name and last name into full name")
  const mergeMatch = command.match(
    /(?:merge|combine)\s+([a-zA-Z0-9_ ()]+?)\s+and\s+([a-zA-Z0-9_ ()]+?)\s+(?:into|to|as)\s+([a-zA-Z0-9_ ()]+)/i
  );
  if (mergeMatch) {
    const c1 = resolveCol(mergeMatch[1], columns);
    const c2 = resolveCol(mergeMatch[2], columns);
    const target = resolveCol(mergeMatch[3], columns) || mergeMatch[3].trim();
    if (c1 && c2 && target) {
      return {
        explanation: `Merge columns "${columns.find((c) => c.id === c1)?.name || c1}" and "${
          columns.find((c) => c.id === c2)?.name || c2
        }" into "${target}"`,
        operations: [
          {
            type: 'merge_columns',
            sourceColumns: [c1, c2],
            targetColumn: target,
            separator: ' ',
          },
        ],
      };
    }
  }

  // 10. ADD PREFIX / SUFFIX (e.g. "add https:// to domain", "append .com to site")
  const prefixMatch = command.match(
    /add\s+([^\s]+)\s+to\s+(?:beginning\s+of\s+|start\s+of\s+)?([a-zA-Z0-9_ ()]+)/i
  );
  if (prefixMatch && !cmd.includes('row')) {
    const pref = prefixMatch[1].trim().replace(/^["']|["']$/g, '');
    const targetCol = resolveCol(prefixMatch[2], columns);
    if (targetCol) {
      return {
        explanation: `Add prefix "${pref}" to column "${columns.find((c) => c.id === targetCol)?.name || ''}"`,
        operations: [{ type: 'prefix_suffix', columns: [targetCol], prefix: pref }],
      };
    }
  }

  // 11. MATH OPERATION (e.g. "multiply price by 1.2", "add 10 to price")
  const mathMatch = command.match(/(multiply|divide|add|subtract)\s+([a-zA-Z0-9_ ()]+?)\s+(?:by|with)\s+([0-9.]+)/i);
  if (mathMatch) {
    const op = mathMatch[1].toLowerCase();
    const col = resolveCol(mathMatch[2], columns);
    const val = parseFloat(mathMatch[3]);
    if (col && !isNaN(val)) {
      return {
        explanation: `Apply ${op} ${val} to column "${columns.find((c) => c.id === col)?.name || ''}"`,
        operations: [{ type: 'math_operation', column: col, operator: op, value: val }],
      };
    }
  }

  // 12. REPLACE / CHANGE VALUE FROM X TO Y (e.g. "change value from X to Y", "replace value X with Y", "change MD to Managing Director")
  const replaceMatch = command.match(
    /(?:change|replace|convert)\s+(?:all\s+)?(?:value\s+)?(?:from\s+)?["']?([^"']+)["']?\s+(?:to|with|into)\s+["']?([^"']+)["']?(?:\s+in\s+([a-zA-Z0-9_ ()]+))?/i
  );
  if (replaceMatch) {
    const from = replaceMatch[1].trim();
    let to = replaceMatch[2].trim();
    const specifiedCol = replaceMatch[3] ? resolveCol(replaceMatch[3], columns) : null;
    const targetCol = specifiedCol || explicitColId;

    if (!/^(?:lower|lowercase|upper|uppercase|title|titlecase)$/i.test(to)) {
      if (to.toLowerCase() === 'empty' || to.toLowerCase() === 'blank') to = '';
      return {
        explanation: `Replace "${from}" with "${to}"${
          targetCol ? ` in column "${columns.find((c) => c.id === targetCol)?.name || ''}"` : ' across all columns'
        }`,
        operations: [
          {
            type: 'replace_values',
            column: targetCol || undefined,
            columns: targetCol ? [targetCol] : columns.map((c) => c.id),
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

