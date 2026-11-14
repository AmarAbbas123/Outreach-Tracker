import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import Dataset from '../models/Dataset.js';
import DatasetRow from '../models/DatasetRow.js';
import Prospect from '../models/Prospect.js';
import Campaign from '../models/Campaign.js';
import Blacklist from '../models/Blacklist.js';
import normalizeDomain from '../utils/normalizeDomain.js';

// POST /datasets/upload
export const uploadDataset = async (req, res, next) => {
  try {
    const workspaceId = req.workspaceId;
    const userId = req.user?._id;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file.' });
    }

    const originalFileName = req.file.originalname || 'dataset.csv';
    const extension = originalFileName.split('.').pop()?.toLowerCase();
    let rawRows = [];
    let sheetNames = ['Sheet1'];
    let selectedSheet = req.body.sheetName || 'Sheet1';

    if (extension === 'xlsx' || extension === 'xls') {
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      sheetNames = workbook.SheetNames;
      selectedSheet = sheetNames.includes(selectedSheet) ? selectedSheet : sheetNames[0];
      const worksheet = workbook.Sheets[selectedSheet];
      rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    } else {
      // CSV or TSV
      const text = req.file.buffer.toString('utf-8');
      const delimiter = extension === 'tsv' ? '\t' : ',';
      const parsed = Papa.parse(text, {
        delimiter,
        skipEmptyLines: 'greedy',
      });
      rawRows = parsed.data || [];
    }

    if (rawRows.length === 0) {
      return res.status(400).json({ success: false, message: 'Uploaded file is empty.' });
    }

    // Header row detection
    const firstRow = rawRows[0] || [];
    const columns = [];
    const headerRow = [];

    firstRow.forEach((val, i) => {
      const colName = String(val).trim() || `Column ${i + 1}`;
      const colId = `col_${i}_${colName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      headerRow.push(colName);
      columns.push({
        id: colId,
        name: colName,
        type: 'text',
        order: i,
        hidden: false,
      });
    });

    const datasetName = req.body.name || originalFileName.replace(/\.[^/.]+$/, '');

    // Create Dataset document
    const dataset = await Dataset.create({
      workspace: workspaceId,
      name: datasetName,
      originalFileName,
      sheetName: selectedSheet,
      columns,
      rowCount: Math.max(0, rawRows.length - 1),
      status: 'ready',
      steps: [
        {
          label: `Uploaded ${originalFileName} (${Math.max(0, rawRows.length - 1)} rows)`,
          rowsAffected: Math.max(0, rawRows.length - 1),
          at: new Date(),
          byAI: false,
        },
      ],
      createdBy: userId,
    });

    // Insert rows in batches
    const rowDocs = [];
    const dataRows = rawRows.slice(1, 20001); // Up to 20,000 rows as per spec

    dataRows.forEach((row, idx) => {
      const cells = {};
      columns.forEach((col, cIdx) => {
        cells[col.id] = row[cIdx] !== undefined ? String(row[cIdx]).trim() : '';
      });

      rowDocs.push({
        dataset: dataset._id,
        index: idx,
        cells,
        original: { ...cells },
        isDeleted: false,
        isAdded: false,
      });
    });

    if (rowDocs.length > 0) {
      await DatasetRow.insertMany(rowDocs, { ordered: false });
    }

    res.status(201).json({
      success: true,
      data: {
        dataset,
        sheetNames,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /datasets
export const listDatasets = async (req, res, next) => {
  try {
    const datasets = await Dataset.find({ workspace: req.workspaceId })
      .populate('sentToCampaign', 'name')
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ success: true, data: { datasets } });
  } catch (err) {
    next(err);
  }
};

// GET /datasets/:id
export const getDataset = async (req, res, next) => {
  try {
    const dataset = await Dataset.findOne({
      _id: req.params.id,
      workspace: req.workspaceId,
    })
      .populate('sentToCampaign', 'name')
      .lean();

    if (!dataset) {
      return res.status(404).json({ success: false, message: 'Dataset not found.' });
    }

    res.json({ success: true, data: { dataset } });
  } catch (err) {
    next(err);
  }
};

// GET /datasets/:id/rows
export const getDatasetRows = async (req, res, next) => {
  try {
    const rows = await DatasetRow.find({
      dataset: req.params.id,
      isDeleted: { $ne: true },
    })
      .sort({ index: 1 })
      .lean();

    res.json({ success: true, data: { rows } });
  } catch (err) {
    next(err);
  }
};

// PATCH /datasets/:id/rows (Save batch changes)
export const updateDatasetRows = async (req, res, next) => {
  try {
    const { updatedRows = [], addedRows = [], deletedRowIds = [], stepLabel } = req.body;
    const datasetId = req.params.id;

    // Verify dataset belongs to workspace
    const dataset = await Dataset.findOne({ _id: datasetId, workspace: req.workspaceId });
    if (!dataset) {
      return res.status(404).json({ success: false, message: 'Dataset not found.' });
    }

    // 1. Process Updates
    const bulkOps = [];
    updatedRows.forEach((r) => {
      bulkOps.push({
        updateOne: {
          filter: { _id: r._id, dataset: datasetId },
          update: { $set: { cells: r.cells } },
        },
      });
    });

    if (deletedRowIds.length > 0) {
      bulkOps.push({
        updateMany: {
          filter: { _id: { $in: deletedRowIds }, dataset: datasetId },
          update: { $set: { isDeleted: true } },
        },
      });
    }

    if (bulkOps.length > 0) {
      await DatasetRow.bulkWrite(bulkOps);
    }

    // 2. Process Additions
    if (addedRows.length > 0) {
      const highestRow = await DatasetRow.findOne({ dataset: datasetId }).sort({ index: -1 });
      let nextIndex = (highestRow?.index ?? -1) + 1;

      const docsToInsert = addedRows.map((r) => ({
        dataset: datasetId,
        index: nextIndex++,
        cells: r.cells || {},
        original: r.cells || {},
        isAdded: true,
        isDeleted: false,
      }));

      await DatasetRow.insertMany(docsToInsert);
    }

    // 3. Count remaining active rows
    const activeCount = await DatasetRow.countDocuments({ dataset: datasetId, isDeleted: false });
    dataset.rowCount = activeCount;

    if (stepLabel) {
      dataset.steps.push({
        label: stepLabel,
        at: new Date(),
        rowsAffected: updatedRows.length + deletedRowIds.length + addedRows.length,
      });
    }

    await dataset.save();

    res.json({ success: true, data: { rowCount: activeCount } });
  } catch (err) {
    next(err);
  }
};

// PATCH /datasets/:id/columns
export const updateDatasetColumns = async (req, res, next) => {
  try {
    const { columns, stepLabel } = req.body;
    const dataset = await Dataset.findOne({ _id: req.params.id, workspace: req.workspaceId });

    if (!dataset) {
      return res.status(404).json({ success: false, message: 'Dataset not found.' });
    }

    if (Array.isArray(columns)) {
      dataset.columns = columns;
    }

    if (stepLabel) {
      dataset.steps.push({
        label: stepLabel,
        at: new Date(),
        rowsAffected: dataset.rowCount,
      });
    }

    await dataset.save();

    res.json({ success: true, data: { columns: dataset.columns } });
  } catch (err) {
    next(err);
  }
};

// POST /datasets/:id/reset (Restore original data)
export const resetDataset = async (req, res, next) => {
  try {
    const dataset = await Dataset.findOne({ _id: req.params.id, workspace: req.workspaceId });
    if (!dataset) {
      return res.status(404).json({ success: false, message: 'Dataset not found.' });
    }

    // Delete dynamically added rows
    await DatasetRow.deleteMany({ dataset: dataset._id, isAdded: true });

    // Restore original cells and un-delete original rows
    const rows = await DatasetRow.find({ dataset: dataset._id, isAdded: { $ne: true } });
    const bulkOps = rows.map((r) => ({
      updateOne: {
        filter: { _id: r._id },
        update: {
          $set: {
            cells: { ...r.original },
            isDeleted: false,
          },
        },
      },
    }));

    if (bulkOps.length > 0) {
      await DatasetRow.bulkWrite(bulkOps);
    }

    const rowCount = await DatasetRow.countDocuments({ dataset: dataset._id, isDeleted: false });
    dataset.rowCount = rowCount;
    dataset.steps.push({
      label: 'Reset to original data',
      at: new Date(),
      rowsAffected: rowCount,
    });

    await dataset.save();

    res.json({ success: true, message: 'Dataset reset to original state.', data: { rowCount } });
  } catch (err) {
    next(err);
  }
};

// POST /datasets/:id/duplicate
export const duplicateDataset = async (req, res, next) => {
  try {
    const original = await Dataset.findOne({ _id: req.params.id, workspace: req.workspaceId }).lean();
    if (!original) {
      return res.status(404).json({ success: false, message: 'Dataset not found.' });
    }

    const newDataset = await Dataset.create({
      workspace: original.workspace,
      name: `${original.name} (Copy)`,
      originalFileName: original.originalFileName,
      sheetName: original.sheetName,
      columns: original.columns,
      rowCount: original.rowCount,
      status: 'ready',
      steps: [
        {
          label: `Duplicated from ${original.name}`,
          at: new Date(),
          rowsAffected: original.rowCount,
        },
      ],
      createdBy: req.user?._id,
    });

    // Copy rows
    const rows = await DatasetRow.find({ dataset: original._id }).lean();
    const newRows = rows.map((r) => ({
      dataset: newDataset._id,
      index: r.index,
      cells: r.cells,
      original: r.original,
      isDeleted: r.isDeleted,
      isAdded: r.isAdded,
    }));

    if (newRows.length > 0) {
      await DatasetRow.insertMany(newRows);
    }

    res.status(201).json({ success: true, data: { dataset: newDataset } });
  } catch (err) {
    next(err);
  }
};

// GET /datasets/:id/export?format=csv|xlsx
export const exportDataset = async (req, res, next) => {
  try {
    const { format = 'csv' } = req.query;
    const dataset = await Dataset.findOne({ _id: req.params.id, workspace: req.workspaceId }).lean();

    if (!dataset) {
      return res.status(404).json({ success: false, message: 'Dataset not found.' });
    }

    const rows = await DatasetRow.find({
      dataset: dataset._id,
      isDeleted: { $ne: true },
    })
      .sort({ index: 1 })
      .lean();

    const activeColumns = dataset.columns.filter((c) => !c.hidden);

    const sheetData = rows.map((r) => {
      const rowObj = {};
      activeColumns.forEach((c) => {
        rowObj[c.name] = r.cells[c.id] ?? '';
      });
      return rowObj;
    });

    const fileNameSafe = dataset.name.replace(/[^a-zA-Z0-9_-]/g, '_');

    if (format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(sheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'CleanedData');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileNameSafe}.xlsx"`);
      return res.send(buffer);
    } else {
      const csv = Papa.unparse(sheetData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${fileNameSafe}.csv"`);
      return res.send(csv);
    }
  } catch (err) {
    next(err);
  }
};

// POST /datasets/:id/send-to-outreach
export const sendToOutreach = async (req, res, next) => {
  try {
    const { mapping, campaign, duplicateAction = 'skip' } = req.body;
    const workspaceId = req.workspaceId;
    const userId = req.user?._id;

    if (!campaign) {
      return res.status(400).json({ success: false, message: 'Target campaign is required.' });
    }

    if (!mapping || !mapping.domain) {
      return res.status(400).json({ success: false, message: 'Domain column mapping is required.' });
    }

    const dataset = await Dataset.findOne({ _id: req.params.id, workspace: workspaceId });
    if (!dataset) {
      return res.status(404).json({ success: false, message: 'Dataset not found.' });
    }

    const campaignDoc = await Campaign.findOne({ _id: campaign, workspace: workspaceId });
    if (!campaignDoc) {
      return res.status(400).json({ success: false, message: 'Invalid campaign.' });
    }

    // Fetch Blacklist
    const blacklists = await Blacklist.find({ workspace: workspaceId }).select('domain').lean();
    const blacklistSet = new Set(blacklists.map((b) => b.domain.toLowerCase()));

    // Fetch existing prospects in campaign
    const existingProspects = await Prospect.find({ workspace: workspaceId, campaign }).select('domain').lean();
    const existingDomains = new Map(existingProspects.map((p) => [p.domain.toLowerCase(), p._id]));

    const rows = await DatasetRow.find({ dataset: dataset._id, isDeleted: { $ne: true } })
      .sort({ index: 1 })
      .lean();

    const batchDomains = new Set();
    const toInsert = [];
    let duplicatesSkipped = 0;
    let blacklistedSkipped = 0;
    const invalidRows = [];

    rows.forEach((r, idx) => {
      const rowNum = idx + 1;
      const rawDomain = r.cells[mapping.domain] || '';
      const normalized = normalizeDomain(rawDomain);

      if (!normalized) {
        invalidRows.push({ row: rowNum, reason: 'Invalid or missing domain.' });
        return;
      }

      if (blacklistSet.has(normalized)) {
        blacklistedSkipped++;
        return;
      }

      if (existingDomains.has(normalized) || batchDomains.has(normalized)) {
        if (duplicateAction === 'skip') {
          duplicatesSkipped++;
          return;
        }
      }

      batchDomains.add(normalized);

      // parse metrics
      const rawDr = mapping.dr ? parseInt(r.cells[mapping.dr], 10) : 0;
      const rawTraffic = mapping.traffic ? parseInt(r.cells[mapping.traffic], 10) : 0;

      // parse tags
      let tagList = [];
      if (mapping.tags && r.cells[mapping.tags]) {
        tagList = String(r.cells[mapping.tags])
          .split(/[,;|]/)
          .map((t) => t.trim())
          .filter(Boolean);
      }

      toInsert.push({
        workspace: workspaceId,
        campaign,
        domain: normalized,
        pageUrl: mapping.page_url ? r.cells[mapping.page_url] || '' : '',
        contactName: mapping.contact_name ? r.cells[mapping.contact_name] || '' : '',
        contactEmail: mapping.contact_email ? (r.cells[mapping.contact_email] || '').toLowerCase().trim() : '',
        niche: mapping.niche ? r.cells[mapping.niche] || '' : '',
        country: mapping.country ? r.cells[mapping.country] || '' : '',
        metrics: {
          dr: Math.min(100, Math.max(0, isNaN(rawDr) ? 0 : rawDr)),
          traffic: Math.max(0, isNaN(rawTraffic) ? 0 : rawTraffic),
        },
        tags: tagList,
        notes: mapping.notes ? r.cells[mapping.notes] || '' : '',
        status: 'new',
        statusHistory: [
          {
            status: 'new',
            changedAt: new Date(),
            changedBy: userId,
          },
        ],
      });
    });

    let importedCount = 0;
    if (toInsert.length > 0) {
      const inserted = await Prospect.insertMany(toInsert, { ordered: false });
      importedCount = inserted.length;
    }

    // Mark dataset as sent
    dataset.status = 'sent';
    dataset.sentToCampaign = campaign;
    dataset.lastSentAt = new Date();
    dataset.steps.push({
      label: `Sent ${importedCount} clean prospects to campaign "${campaignDoc.name}"`,
      rowsAffected: importedCount,
      at: new Date(),
    });
    await dataset.save();

    res.json({
      success: true,
      data: {
        summary: {
          imported: importedCount,
          duplicatesSkipped,
          blacklistedSkipped,
          invalidRowsCount: invalidRows.length,
          invalidRows: invalidRows.slice(0, 25),
          totalProcessed: rows.length,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /datasets/:id
export const deleteDataset = async (req, res, next) => {
  try {
    const dataset = await Dataset.findOneAndDelete({ _id: req.params.id, workspace: req.workspaceId });
    if (!dataset) {
      return res.status(404).json({ success: false, message: 'Dataset not found.' });
    }

    await DatasetRow.deleteMany({ dataset: req.params.id });

    res.json({ success: true, message: 'Dataset deleted.' });
  } catch (err) {
    next(err);
  }
};
