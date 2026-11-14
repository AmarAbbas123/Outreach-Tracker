import { aiOperationsResponse, aiValueMapResponse } from '../schemas/aiClean.js';
import normalizeDomain from '../utils/normalizeDomain.js';

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
export const parseCommand = async (req, res, next) => {
  try {
    const { command, columns = [] } = req.body;
    if (!command || !command.trim()) {
      return res.status(400).json({ success: false, message: 'Command is required.' });
    }

    const cmd = command.toLowerCase();
    const operations = [];

    // Helper: find column ID by name or role
    const findCol = (regex) => columns.find((c) => regex.test(c.name))?.id || columns[0]?.id;

    // 1. Lowercase / Case commands
    if (cmd.includes('lowercase') || cmd.includes('lower case')) {
      let targetCols = columns.map((c) => c.id);
      if (cmd.includes('domain') || cmd.includes('website')) {
        const dCol = findCol(/domain|website|url/i);
        if (dCol) targetCols = [dCol];
      } else if (cmd.includes('email')) {
        const eCol = findCol(/email|mail/i);
        if (eCol) targetCols = [eCol];
      }
      operations.push({
        type: 'change_case',
        columns: targetCols,
        mode: 'lower',
      });
    }

    // 2. Remove rows where email is empty
    if ((cmd.includes('remove') || cmd.includes('delete')) && cmd.includes('email') && (cmd.includes('empty') || cmd.includes('no email'))) {
      const eCol = findCol(/email|mail/i);
      operations.push({
        type: 'delete_rows',
        where: [{ column: eCol, op: 'is_empty' }],
      });
    }

    // 3. Remove duplicates
    if (cmd.includes('duplicate') || cmd.includes('dedup')) {
      const dCol = findCol(/domain|website|url/i);
      operations.push({
        type: 'remove_duplicates',
        columns: [dCol],
        keep: 'first',
      });
    }

    // 4. Extract domain
    if (cmd.includes('extract domain') || cmd.includes('clean domain') || cmd.includes('clean url')) {
      const dCol = findCol(/domain|website|url/i);
      operations.push({
        type: 'extract_domain',
        column: dCol,
        target: dCol,
      });
    }

    // 5. Trim
    if (cmd.includes('trim') || cmd.includes('spaces')) {
      operations.push({
        type: 'trim',
        columns: columns.map((c) => c.id),
      });
    }

    // 6. Replace values (e.g. "change X to Y" or "replace X with Y")
    const replaceMatch = command.match(/(?:change|replace)\s+(?:all\s+)?["']?([^"']+)["']?\s+(?:to|with)\s+["']?([^"']+)["']?/i);
    if (replaceMatch) {
      const from = replaceMatch[1].trim();
      const to = replaceMatch[2].trim();
      const targetCol = columns[0]?.id;
      operations.push({
        type: 'replace_values',
        column: targetCol,
        from,
        to,
        match: 'contains',
        matchCase: false,
        scope: 'sheet',
      });
    }

    // Fallback: If no direct rule matched, generate an intelligent ai_rewrite
    if (operations.length === 0) {
      operations.push({
        type: 'ai_rewrite',
        columns: [columns[0]?.id],
        instruction: command,
        scope: 'sheet',
      });
    }

    const validated = aiOperationsResponse.parse({ operations });
    res.json({ success: true, data: validated });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/ai/clean/standardize
export const standardizeValues = async (req, res, next) => {
  try {
    const { values = [], instruction = 'Standardize values' } = req.body;
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
